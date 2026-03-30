#!/bin/bash

# Quick Test Script - Run only essential tests

set -e

echo "🎯 Quick Test Suite"
echo ""

# Frontend Unit Tests (fast)
echo "Running frontend unit tests..."
cd /app/frontend
yarn test --watchAll=false --bail

# Backend Unit Tests (fast)
echo "Running backend unit tests..."
cd /app/backend
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="tradepro_test"
pytest tests/unit/ -x

echo ""
echo "✅ Quick tests passed!"
echo ""
echo "For full test suite, run: ./run-all-tests.sh"