# Test Credentials for TRADEPRO AI

## Admin Accounts

### Primary Admin
- Email: admin@tradepro.com
- Password: admin123
- Role: admin
- 2FA: Disabled
- Status: Active

### Test Admin
- Email: testadmin@example.com
- Password: AdminPass123!
- Role: admin
- Status: Active

## User Accounts

### Test User 1
- Email: testuser1@example.com
- Password: TestPass123!
- Role: user
- Status: Active
- Has brokers: Yes (Zerodha)
- Has strategies: Yes (2)

### Test User 2
- Email: testuser2@example.com
- Password: TestPass123!
- Role: user
- Status: Active
- Has brokers: No
- Has strategies: No

### Suspended User
- Email: suspended@example.com
- Password: TestPass123!
- Role: user
- Status: Suspended
- Note: Should not be able to login

## Broker Credentials (Sandbox)

### Zerodha Test
- API Key: test_zerodha_api_key
- API Secret: test_zerodha_api_secret
- Environment: Sandbox

### Upstox Test
- API Key: test_upstox_api_key
- API Secret: test_upstox_api_secret
- Environment: Sandbox

### Binance Test
- API Key: test_binance_api_key
- API Secret: test_binance_api_secret
- Environment: Testnet

## API Tokens

### Valid Access Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6ImFkbWluQHRyYWRlcHJvLmNvbSIsImV4cCI6OTk5OTk5OTk5OSwidHlwZSI6ImFjY2VzcyJ9
```
(Note: This is a sample token for testing only)

### Expired Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJleHAiOjE1MTYyMzkwMjJ9
```

## Database Test Data

### Test Database
- Name: tradepro_test
- URL: mongodb://localhost:27017/tradepro_test
- Drop after tests: Yes

## Environment Variables for Tests

```bash
MONGO_URL=mongodb://localhost:27017
DB_NAME=tradepro_test
JWT_SECRET=test-secret-key-for-testing-only
ADMIN_EMAIL=admin@tradepro.com
ADMIN_PASSWORD=admin123
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Notes

- Never use these credentials in production
- Rotate test credentials monthly
- All test data is wiped after test runs
- Broker connections are simulated (no real trades)
- Market data is mocked

## Regenerating Test Data

```bash
cd /app/tests
python fixtures/factories/seed_test_data.py
```

## Security

- Test credentials are for testing only
- Do not commit real API keys
- Use environment variables for sensitive data
- Test database is isolated from production
