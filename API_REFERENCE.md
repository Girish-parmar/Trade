# TradePro AI V3.0 - API Endpoints Reference

## 🔐 Authentication & User Management

### POST /api/auth/register
Register new user account
```json
Request:
{
  "email": "trader@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "phone_number": "+91-9876543210",
  "pan_card": "ABCDE1234F"
}

Response:
{
  "user_id": "uuid",
  "email": "trader@example.com",
  "kyc_status": "pending",
  "message": "Registration successful. Please complete KYC verification."
}
```

### POST /api/auth/login
Login and get JWT token
```json
Request:
{
  "email": "trader@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "trader@example.com",
    "role": "trader",
    "trading_enabled": false
  }
}
```

### GET /api/auth/me
Get current user profile
```
Headers: Authorization: Bearer <token>

Response:
{
  "id": "uuid",
  "email": "trader@example.com",
  "full_name": "John Doe",
  "role": "trader",
  "kyc_status": "pending",
  "trading_enabled": false,
  "region": "IN"
}
```

## 📄 KYC & Compliance

### POST /api/kyc/documents
Upload KYC document
```json
Headers: Authorization: Bearer <token>

Request (multipart/form-data):
{
  "document_type": "PAN",
  "document_number": "ABCDE1234F",
  "file": <binary>
}

Response:
{
  "document_id": "uuid",
  "document_type": "PAN",
  "verification_status": "pending",
  "uploaded_at": "2025-08-15T10:30:00Z"
}
```

### GET /api/kyc/status
Get KYC verification status
```
Headers: Authorization: Bearer <token>

Response:
{
  "kyc_status": "approved",
  "verified_at": "2025-08-15T14:30:00Z",
  "kyc_expiry": "2026-08-15T14:30:00Z",
  "documents": [
    {
      "type": "PAN",
      "status": "approved",
      "verified_at": "2025-08-15T14:30:00Z"
    }
  ],
  "trading_enabled": true
}
```

### POST /api/kyc/approve (Compliance Officer only)
Approve KYC document
```json
Headers: Authorization: Bearer <token>
Requires: role=compliance_officer

Request:
{
  "document_id": "uuid",
  "approved": true,
  "notes": "All documents verified"
}

Response:
{
  "document_id": "uuid",
  "verification_status": "approved",
  "verified_by": "officer-uuid",
  "verified_at": "2025-08-15T14:30:00Z"
}
```

## 📊 Trading - Orders

### POST /api/orders/place
Place new order
```json
Headers: Authorization: Bearer <token>
Requires: role=trader, trading_enabled=true

Request:
{
  "symbol": "RELIANCE",
  "exchange": "NSE",
  "order_type": "limit",
  "side": "buy",
  "quantity": 100,
  "price": 2500.50,
  "trigger_price": null
}

Response:
{
  "order_id": "uuid",
  "symbol": "RELIANCE",
  "status": "pending",
  "pre_trade_check": {
    "passed": true,
    "margin_available": 250000,
    "margin_required": 125000,
    "risk_score": 15.5
  },
  "formal_verify_hash": "abc123...",
  "submitted_at": "2025-08-15T10:30:00Z",
  "message": "Order placed successfully"
}
```

### GET /api/orders
Get user orders
```
Headers: Authorization: Bearer <token>

Query Parameters:
- status: pending|open|filled|cancelled
- symbol: RELIANCE
- from_date: 2025-08-01
- to_date: 2025-08-31

Response:
{
  "orders": [
    {
      "order_id": "uuid",
      "symbol": "RELIANCE",
      "side": "buy",
      "quantity": 100,
      "filled_quantity": 100,
      "price": 2500.50,
      "status": "filled",
      "submitted_at": "2025-08-15T10:30:00Z",
      "filled_at": "2025-08-15T10:30:15Z"
    }
  ],
  "total": 1
}
```

### DELETE /api/orders/{order_id}
Cancel order
```
Headers: Authorization: Bearer <token>

Response:
{
  "order_id": "uuid",
  "status": "cancelled",
  "cancelled_at": "2025-08-15T10:35:00Z",
  "message": "Order cancelled successfully"
}
```

## 💼 Positions & Portfolio

### GET /api/positions
Get current positions
```
Headers: Authorization: Bearer <token>

Response:
{
  "positions": [
    {
      "symbol": "RELIANCE",
      "exchange": "NSE",
      "quantity": 100,
      "average_price": 2500.50,
      "current_price": 2550.00,
      "unrealized_pnl": 4950.00,
      "realized_pnl": 0,
      "margin_required": 125000,
      "margin_available": 125000
    }
  ],
  "total_value": 255000,
  "total_pnl": 4950.00
}
```

### GET /api/portfolio/summary
Portfolio summary
```
Headers: Authorization: Bearer <token>

Response:
{
  "total_investment": 250000,
  "current_value": 255000,
  "total_pnl": 5000,
  "pnl_percentage": 2.0,
  "day_pnl": 1500,
  "cash_balance": 100000,
  "margin_used": 125000,
  "margin_available": 25000
}
```

## 📈 Market Data

### GET /api/market/quote/{symbol}
Get real-time quote
```
Response:
{
  "symbol": "RELIANCE",
  "exchange": "NSE",
  "last_price": 2550.00,
  "change": 25.50,
  "change_percent": 1.01,
  "open": 2525.00,
  "high": 2560.00,
  "low": 2520.00,
  "volume": 1250000,
  "timestamp": "2025-08-15T10:30:00Z"
}
```

### GET /api/market/depth/{symbol}
Order book depth
```
Response:
{
  "symbol": "RELIANCE",
  "bids": [
    {"price": 2549.50, "quantity": 500},
    {"price": 2549.00, "quantity": 1000}
  ],
  "asks": [
    {"price": 2550.00, "quantity": 300},
    {"price": 2550.50, "quantity": 800}
  ],
  "timestamp": "2025-08-15T10:30:00Z"
}
```

## 🤖 Algo Trading

### POST /api/algo/strategy/deploy
Deploy algo strategy
```json
Headers: Authorization: Bearer <token>
Requires: permission=algo.deploy

Request:
{
  "strategy_type": "twap",
  "symbol": "RELIANCE",
  "total_quantity": 1000,
  "duration_minutes": 60,
  "order_slices": 10,
  "max_deviation": 0.5
}

Response:
{
  "algo_id": "uuid",
  "strategy_type": "twap",
  "status": "active",
  "deployed_at": "2025-08-15T10:30:00Z",
  "estimated_completion": "2025-08-15T11:30:00Z"
}
```

### GET /api/algo/strategy/{algo_id}/status
Get algo execution status
```
Response:
{
  "algo_id": "uuid",
  "strategy_type": "twap",
  "status": "running",
  "progress": {
    "total_quantity": 1000,
    "filled_quantity": 450,
    "remaining_quantity": 550,
    "average_price": 2548.75,
    "slices_completed": 4,
    "slices_remaining": 6
  },
  "child_orders": [
    {"order_id": "uuid", "quantity": 100, "status": "filled"},
    {"order_id": "uuid", "quantity": 100, "status": "filled"}
  ]
}
```

## 🔍 Audit & Compliance

### GET /api/audit/logs
Get audit trail (Compliance Officer only)
```
Headers: Authorization: Bearer <token>
Requires: role=compliance_officer

Query Parameters:
- user_id: uuid
- action_type: ORDER_PLACED|KYC_APPROVED
- from_date: 2025-08-01
- to_date: 2025-08-31

Response:
{
  "logs": [
    {
      "log_id": "uuid",
      "timestamp": "2025-08-15T10:30:00Z",
      "user_id": "uuid",
      "action_type": "ORDER_PLACED",
      "entity_type": "Order",
      "entity_id": "order-uuid",
      "event_data": {"symbol": "RELIANCE", "quantity": 100},
      "compliance_category": "SEBI",
      "current_log_hash": "abc123...",
      "hsm_signature": "xyz789..."
    }
  ],
  "total": 1,
  "chain_verified": true
}
```

### POST /api/audit/verify-chain
Verify audit log integrity
```json
Headers: Authorization: Bearer <token>
Requires: role=compliance_officer

Request:
{
  "from_log_id": 1,
  "to_log_id": 1000
}

Response:
{
  "verified": true,
  "total_entries": 1000,
  "verified_entries": 1000,
  "failed_entries": 0,
  "issues": [],
  "merkle_root": "abc123..."
}
```

### GET /api/compliance/flags
Get compliance flags
```
Headers: Authorization: Bearer <token>
Requires: role=compliance_officer

Query Parameters:
- severity: info|warning|critical|regulatory
- status: open|investigating|resolved
- flag_type: suspicious_activity|circuit_breaker

Response:
{
  "flags": [
    {
      "flag_id": "uuid",
      "flag_type": "fat_finger",
      "severity": "warning",
      "title": "Abnormal order size detected",
      "description": "Order quantity 10x normal pattern",
      "user_id": "uuid",
      "order_id": "uuid",
      "status": "open",
      "created_at": "2025-08-15T10:30:00Z",
      "requires_regulatory_report": false
    }
  ],
  "total": 1
}
```

## 📊 Reporting

### GET /api/reports/regulatory/sebi-daily
Generate SEBI daily report (Admin only)
```
Headers: Authorization: Bearer <token>
Requires: role=admin|compliance_officer

Query Parameters:
- date: 2025-08-15

Response:
{
  "report_id": "uuid",
  "report_type": "SEBI_DAILY",
  "reporting_date": "2025-08-15",
  "summary": {
    "total_orders": 1500,
    "total_value": 15000000,
    "unique_users": 250,
    "circuit_breakers": 0,
    "compliance_flags": 3
  },
  "report_url": "https://s3.../reports/sebi-daily-2025-08-15.pdf",
  "report_hash": "abc123...",
  "hsm_signature": "xyz789...",
  "generated_at": "2025-08-15T18:00:00Z"
}
```

### GET /api/reports/tax/capital-gains
Generate capital gains report
```
Headers: Authorization: Bearer <token>

Query Parameters:
- financial_year: 2024-25

Response:
{
  "financial_year": "2024-25",
  "short_term_gains": 50000,
  "long_term_gains": 25000,
  "total_gains": 75000,
  "transactions": [
    {
      "symbol": "RELIANCE",
      "buy_date": "2024-04-01",
      "sell_date": "2024-10-01",
      "buy_price": 2400,
      "sell_price": 2600,
      "quantity": 100,
      "gain": 20000,
      "type": "short_term"
    }
  ],
  "report_url": "https://s3.../reports/capital-gains-2024-25.pdf"
}
```

## 🔐 HSM & Security

### POST /api/hsm/keys/generate (Admin only)
Generate new HSM key
```json
Headers: Authorization: Bearer <token>
Requires: role=admin

Request:
{
  "key_type": "signing_key",
  "key_alias": "audit_signing_2025",
  "purpose": "Sign audit log entries for 2025"
}

Response:
{
  "key_id": "uuid",
  "key_identifier": "hsm-key-abc123",
  "key_alias": "audit_signing_2025",
  "key_type": "signing_key",
  "status": "active",
  "fips_140_2_certified": true,
  "generated_at": "2025-08-15T10:30:00Z",
  "next_rotation_due": "2025-11-15T10:30:00Z"
}
```

### POST /api/hsm/keys/{key_id}/rotate (Admin only)
Rotate HSM key
```
Response:
{
  "old_key_id": "uuid",
  "new_key_id": "uuid",
  "old_key_status": "retired",
  "new_key_status": "active",
  "rotated_at": "2025-08-15T10:30:00Z"
}
```

## 🌍 Region & Access Control

### GET /api/region/check
Check current region access
```
Response:
{
  "region": "IN",
  "ip_address": "103.xxx.xxx.xxx",
  "access_allowed": true,
  "data_storage_region": "IN",
  "compliance_notes": "RBI compliant - data stored in India"
}
```

## 📊 Analytics & Insights

### GET /api/analytics/pnl-breakdown
P&L breakdown by symbol
```
Headers: Authorization: Bearer <token>

Query Parameters:
- from_date: 2025-08-01
- to_date: 2025-08-31

Response:
{
  "period": "2025-08-01 to 2025-08-31",
  "breakdown": [
    {
      "symbol": "RELIANCE",
      "realized_pnl": 5000,
      "unrealized_pnl": 2000,
      "total_pnl": 7000,
      "trades": 15,
      "win_rate": 66.67
    }
  ],
  "total_pnl": 7000
}
```

## 🔔 Notifications & Alerts

### GET /api/alerts
Get user alerts
```
Headers: Authorization: Bearer <token>

Response:
{
  "alerts": [
    {
      "alert_id": "uuid",
      "type": "price_alert",
      "symbol": "RELIANCE",
      "condition": "price >= 2600",
      "triggered": true,
      "triggered_at": "2025-08-15T11:00:00Z",
      "message": "RELIANCE crossed 2600"
    }
  ]
}
```

---

## 📝 Response Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **451 Unavailable For Legal Reasons**: Region restriction (RBI)
- **500 Internal Server Error**: Server error

## 🔒 Security Headers

All API requests should include:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Request-ID: <unique-request-id>
```

## 📊 Rate Limiting

- **Authentication**: 5 requests/minute
- **Trading APIs**: 100 requests/minute
- **Market Data**: 1000 requests/minute
- **Admin APIs**: 20 requests/minute
