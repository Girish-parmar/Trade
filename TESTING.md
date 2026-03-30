# Testing Guide for TRADEPRO AI

## Backend Testing

### Setup
```bash
cd /app/backend
pip install pytest pytest-asyncio httpx
```

### Running Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v
```

### Manual API Testing

#### 1. Authentication Tests

**Register User**
```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "name": "Test User"
  }' \
  -c cookies.txt
```

**Login**
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tradepro.com",
    "password": "admin123"
  }' \
  -c cookies.txt
```

**Get Current User**
```bash
curl -X GET http://localhost:8001/api/auth/me \
  -b cookies.txt
```

**Logout**
```bash
curl -X POST http://localhost:8001/api/auth/logout \
  -b cookies.txt
```

#### 2. Broker Tests

**Connect Broker**
```bash
curl -X POST http://localhost:8001/api/brokers \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "broker_name": "zerodha",
    "api_key": "test_key",
    "api_secret": "test_secret"
  }'
```

**List Brokers**
```bash
curl -X GET http://localhost:8001/api/brokers \
  -b cookies.txt
```

#### 3. Strategy Tests

**Create Strategy**
```bash
curl -X POST http://localhost:8001/api/strategies \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Test Strategy",
    "description": "My first strategy",
    "json_definition": {"nodes": [], "edges": []},
    "tags": ["test"]
  }'
```

**List Strategies**
```bash
curl -X GET http://localhost:8001/api/strategies \
  -b cookies.txt
```

#### 4. Order Tests

**Place Order**
```bash
curl -X POST http://localhost:8001/api/orders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "broker_id": "<broker_id>",
    "symbol": "AAPL",
    "side": "buy",
    "quantity": 10,
    "order_type": "market"
  }'
```

**List Orders**
```bash
curl -X GET http://localhost:8001/api/orders \
  -b cookies.txt
```

#### 5. Market Data Tests

**Get Quote**
```bash
curl -X GET http://localhost:8001/api/market/quote/AAPL \
  -b cookies.txt
```

**Get Candles**
```bash
curl -X GET "http://localhost:8001/api/market/candles/AAPL?interval=1d&limit=30" \
  -b cookies.txt
```

#### 6. Dashboard Tests

**Get Summary**
```bash
curl -X GET http://localhost:8001/api/dashboard/summary \
  -b cookies.txt
```

## Frontend Testing

### Setup
```bash
cd /app/frontend
yarn add --dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Running Tests
```bash
# Run all tests
yarn test

# Run with coverage
yarn test --coverage

# Run in watch mode
yarn test --watch
```

### Manual UI Testing

#### Test Flow 1: User Registration & Login
1. Navigate to http://localhost:3000/register
2. Fill in registration form
3. Submit and verify redirect to dashboard
4. Logout
5. Login with same credentials
6. Verify dashboard loads

#### Test Flow 2: Broker Connection
1. Login as admin
2. Navigate to Settings
3. Click "Add Broker"
4. Select broker and enter API credentials
5. Click "Connect Broker"
6. Verify broker appears in list

#### Test Flow 3: Strategy Creation
1. Navigate to Strategies
2. Click "New Strategy"
3. Enter strategy name
4. Add nodes from library
5. Connect nodes
6. Click "Save Strategy"
7. Verify strategy appears in list

#### Test Flow 4: Order Placement
1. Ensure at least one broker is connected
2. Navigate to Trading Terminal
3. Select symbol from watchlist
4. Enter quantity
5. Select order type
6. Click "Place Buy Order"
7. Verify order appears in Orders page

#### Test Flow 5: Portfolio Monitoring
1. Navigate to Dashboard
2. Verify metrics are displayed
3. Check recent orders section
4. Navigate to Positions
5. Verify positions list

## Integration Testing

### Complete User Journey
```bash
#!/bin/bash

# 1. Register new user
echo "Registering user..."
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"integration@test.com","password":"Test1234","name":"Integration Test"}' \
  -c cookies.txt

# 2. Connect broker
echo "Connecting broker..."
curl -X POST http://localhost:8001/api/brokers \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"broker_name":"zerodha","api_key":"test","api_secret":"test"}'

# 3. Get broker ID
BROKER_ID=$(curl -s -X GET http://localhost:8001/api/brokers -b cookies.txt | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['id'])")

# 4. Place order
echo "Placing order..."
curl -X POST http://localhost:8001/api/orders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"broker_id":"'$BROKER_ID'","symbol":"AAPL","side":"buy","quantity":10,"order_type":"market"}'

# 5. Get orders
echo "Fetching orders..."
curl -X GET http://localhost:8001/api/orders -b cookies.txt

# 6. Get dashboard
echo "Fetching dashboard..."
curl -X GET http://localhost:8001/api/dashboard/summary -b cookies.txt

echo "Integration test complete!"
```

## Performance Testing

### Load Testing with Apache Bench
```bash
# Test login endpoint
ab -n 1000 -c 10 -p login.json -T 'application/json' http://localhost:8001/api/auth/login

# Test market data endpoint
ab -n 5000 -c 50 -H 'Cookie: access_token=<token>' http://localhost:8001/api/market/quote/AAPL
```

## Security Testing

### 1. Test Authentication
- Try accessing protected routes without token
- Test with expired token
- Test with invalid token
- Test CSRF protection

### 2. Test Input Validation
- SQL injection attempts
- XSS attempts
- Invalid email formats
- Weak passwords

### 3. Test Rate Limiting
- Send multiple rapid requests
- Verify 429 response

## Browser Testing

### Supported Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Responsive Testing
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

## Accessibility Testing

### Tools
- axe DevTools
- WAVE Browser Extension
- Lighthouse Audit

### Checklist
- [ ] All interactive elements are keyboard accessible
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators are visible
- [ ] Screen reader compatible

## Database Testing

### MongoDB Verification
```bash
# Connect to MongoDB
mongosh

# Switch to database
use tradepro_db

# Verify collections
show collections

# Check users
db.users.find().pretty()

# Check indexes
db.users.getIndexes()

# Check strategies
db.strategies.find().pretty()

# Check orders
db.orders.find().sort({created_at: -1}).limit(10).pretty()
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - run: pip install -r backend/requirements.txt
      - run: pytest backend/

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && yarn install
      - run: cd frontend && yarn test
```

## Test Credentials

**Admin Account**
- Email: admin@tradepro.com
- Password: admin123

**Test User**
- Email: test@example.com
- Password: Test1234

## Known Issues

1. Mock market data returns random values
2. Broker connections are simulated (no real API calls)
3. Orders are not executed on real markets

## Reporting Bugs

When reporting bugs, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots (if applicable)
5. Browser/OS information
6. Console logs
7. Network requests (if applicable)