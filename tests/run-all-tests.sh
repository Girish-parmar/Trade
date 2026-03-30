#!/bin/bash

# TRADEPRO AI - Test Execution Script
# This script runs all tests and generates reports

set -e

echo "==============================================="
echo "  TRADEPRO AI - Comprehensive Test Suite  "
echo "==============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo ""
    echo "======================="
    echo "  $1"
    echo "======================="
}

# Check prerequisites
print_header "Checking Prerequisites"

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
print_success "Node.js: $(node --version)"

if ! command -v python3 &> /dev/null; then
    print_error "Python is not installed"
    exit 1
fi
print_success "Python: $(python3 --version)"

if ! command -v mongod &> /dev/null; then
    print_warning "MongoDB not found. Tests requiring MongoDB may fail."
else
    print_success "MongoDB: $(mongod --version | head -n 1)"
fi

# Start MongoDB if not running
if ! pgrep -x "mongod" > /dev/null; then
    print_warning "Starting MongoDB..."
    mongod --dbpath /tmp/tradepro_test_db --fork --logpath /tmp/mongod.log
    sleep 2
fi

# Frontend Unit Tests
print_header "Frontend Unit Tests"
cd /app/frontend
if yarn test --coverage --watchAll=false; then
    print_success "Frontend unit tests passed"
else
    print_error "Frontend unit tests failed"
    exit 1
fi

# Backend Unit Tests
print_header "Backend Unit Tests"
cd /app/backend
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="tradepro_test"
export JWT_SECRET="test-secret-key"

if pytest tests/ --cov=. --cov-report=html --cov-report=term; then
    print_success "Backend unit tests passed"
else
    print_error "Backend unit tests failed"
    exit 1
fi

# Start backend server for E2E tests
print_header "Starting Backend Server"
cd /app/backend
uvicorn server:app --host 0.0.0.0 --port 8001 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
print_success "Backend server started (PID: $BACKEND_PID)"
sleep 5

# Start frontend server for E2E tests
print_header "Starting Frontend Server"
cd /app/frontend
yarn start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
print_success "Frontend server started (PID: $FRONTEND_PID)"
sleep 10

# E2E Tests
print_header "E2E Tests (Playwright)"
cd /app/tests
if npx playwright test; then
    print_success "E2E tests passed"
else
    print_error "E2E tests failed"
    E2E_FAILED=1
fi

# Performance Tests (optional, only if k6 is installed)
if command -v k6 &> /dev/null; then
    print_header "Performance Tests (k6)"
    cd /app/tests/performance/load
    if k6 run 01-normal-load.js --vus 50 --duration 30s; then
        print_success "Performance tests passed"
    else
        print_warning "Performance tests failed (non-blocking)"
    fi
else
    print_warning "k6 not installed, skipping performance tests"
fi

# Cleanup
print_header "Cleanup"
kill $BACKEND_PID 2>/dev/null || true
kill $FRONTEND_PID 2>/dev/null || true
print_success "Servers stopped"

# Generate Reports
print_header "Test Reports"
echo "Frontend Coverage: file:///app/frontend/coverage/lcov-report/index.html"
echo "Backend Coverage: file:///app/backend/htmlcov/index.html"
echo "E2E Report: file:///app/tests/reports/playwright/index.html"

# Final Summary
print_header "Test Summary"
if [ -z "$E2E_FAILED" ]; then
    print_success "All tests passed!"
    echo ""
    echo "✅ Frontend Unit Tests: PASSED"
    echo "✅ Backend Unit Tests: PASSED"
    echo "✅ E2E Tests: PASSED"
    echo ""
    exit 0
else
    print_error "Some tests failed"
    echo ""
    echo "✅ Frontend Unit Tests: PASSED"
    echo "✅ Backend Unit Tests: PASSED"
    echo "❌ E2E Tests: FAILED"
    echo ""
    exit 1
fi