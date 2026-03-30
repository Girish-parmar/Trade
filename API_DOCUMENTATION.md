# TRADEPRO AI - API Documentation

## Base URL
```
Production: https://api.tradepro.ai
Development: http://localhost:8001
```

All API endpoints are prefixed with `/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Tokens are stored in HTTP-only cookies.

### Headers
```
Content-Type: application/json
Cookie: access_token=<token>; refresh_token=<token>
```

Alternatively, you can use the Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format

### Success Response
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "string",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Error Response
```json
{
  "detail": "Error message"
}
```

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

---

## Authentication Endpoints

### Register User

**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Cookies Set:**
- `access_token` (15 minutes)
- `refresh_token` (7 days)

---

### Login

**POST** `/api/auth/login`

Authenticate a user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### Get Current User

**GET** `/api/auth/me`

Retrieve the authenticated user's information.

**Headers:** `Cookie: access_token=<token>`

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### Logout

**POST** `/api/auth/logout`

Invalidate the user's session and clear tokens.

**Headers:** `Cookie: access_token=<token>`

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

## Broker Endpoints

### List Brokers

**GET** `/api/brokers`

Get all connected brokers for the authenticated user.

**Response:** `200 OK`
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "broker_name": "zerodha",
    "status": "connected",
    "connected_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### Connect Broker

**POST** `/api/brokers`

Connect a new broker account.

**Request Body:**
```json
{
  "broker_name": "zerodha",
  "api_key": "your_api_key",
  "api_secret": "your_api_secret",
  "additional_config": {}
}
```

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "broker_name": "zerodha",
  "status": "connected",
  "connected_at": "2024-01-01T00:00:00Z"
}
```

---

### Disconnect Broker

**DELETE** `/api/brokers/{broker_id}`

Disconnect a broker account.

**Response:** `200 OK`
```json
{
  "message": "Broker disconnected"
}
```

---

## Strategy Endpoints

### List Strategies

**GET** `/api/strategies`

Get all strategies for the authenticated user.

**Query Parameters:**
- `status` (optional): Filter by status (draft, active, paused, stopped)

**Response:** `200 OK`
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439012",
    "name": "RSI Strategy",
    "description": "Simple RSI-based strategy",
    "status": "active",
    "version": 1,
    "tags": ["rsi", "momentum"],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### Create Strategy

**POST** `/api/strategies`

Create a new trading strategy.

**Request Body:**
```json
{
  "name": "RSI Strategy",
  "description": "Simple RSI-based strategy",
  "json_definition": {
    "nodes": [
      {"id": "1", "type": "indicator", "data": {"label": "RSI"}}
    ],
    "edges": []
  },
  "tags": ["rsi", "momentum"]
}
```

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "507f1f77bcf86cd799439012",
  "name": "RSI Strategy",
  "description": "Simple RSI-based strategy",
  "status": "draft",
  "version": 1,
  "tags": ["rsi", "momentum"],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### Get Strategy

**GET** `/api/strategies/{strategy_id}`

Get detailed information about a specific strategy.

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "user_id": "507f1f77bcf86cd799439012",
  "name": "RSI Strategy",
  "description": "Simple RSI-based strategy",
  "json_definition": {
    "nodes": [],
    "edges": []
  },
  "status": "draft",
  "version": 1,
  "tags": ["rsi"],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### Update Strategy

**PUT** `/api/strategies/{strategy_id}`

Update an existing strategy.

**Request Body:**
```json
{
  "name": "Updated Strategy Name",
  "status": "active"
}
```

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "507f1f77bcf86cd799439012",
  "name": "Updated Strategy Name",
  "description": "Simple RSI-based strategy",
  "status": "active",
  "version": 1,
  "tags": ["rsi"],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

---

### Delete Strategy

**DELETE** `/api/strategies/{strategy_id}`

Delete a strategy.

**Response:** `200 OK`
```json
{
  "message": "Strategy deleted"
}
```

---

## Order Endpoints

### List Orders

**GET** `/api/orders`

Get all orders for the authenticated user.

**Query Parameters:**
- `status` (optional): Filter by status

**Response:** `200 OK`
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "symbol": "AAPL",
    "side": "buy",
    "quantity": 10,
    "price": 150.50,
    "order_type": "limit",
    "status": "filled",
    "filled_quantity": 10,
    "avg_price": 150.45,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### Place Order

**POST** `/api/orders`

Place a new order.

**Request Body:**
```json
{
  "broker_id": "507f1f77bcf86cd799439011",
  "strategy_id": "507f1f77bcf86cd799439012",
  "symbol": "AAPL",
  "side": "buy",
  "quantity": 10,
  "price": 150.50,
  "order_type": "limit",
  "stop_loss": 145.00,
  "take_profit": 160.00
}
```

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "symbol": "AAPL",
  "side": "buy",
  "quantity": 10,
  "price": 150.50,
  "order_type": "limit",
  "status": "pending",
  "filled_quantity": 0,
  "avg_price": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### Cancel Order

**DELETE** `/api/orders/{order_id}`

Cancel an open order.

**Response:** `200 OK`
```json
{
  "message": "Order cancelled"
}
```

---

## Position Endpoints

### List Positions

**GET** `/api/positions`

Get all open positions for the authenticated user.

**Response:** `200 OK`
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "broker_id": "507f1f77bcf86cd799439012",
    "symbol": "AAPL",
    "quantity": 10,
    "avg_price": 150.00,
    "current_price": 155.00,
    "pnl": 50.00,
    "pnl_percent": 3.33
  }
]
```

---

## Market Data Endpoints

### Get Quote

**GET** `/api/market/quote/{symbol}`

Get real-time quote for a symbol.

**Response:** `200 OK`
```json
{
  "symbol": "AAPL",
  "price": 155.50,
  "change": 2.50,
  "change_percent": 1.63,
  "volume": 1234567,
  "high": 156.00,
  "low": 153.00,
  "open": 154.00,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### Get Candles

**GET** `/api/market/candles/{symbol}`

Get historical candlestick data.

**Query Parameters:**
- `interval`: Candle interval (1m, 5m, 15m, 1h, 1d)
- `limit`: Number of candles (default: 100)

**Response:** `200 OK`
```json
[
  {
    "time": "2024-01-01T00:00:00Z",
    "open": 154.00,
    "high": 156.00,
    "low": 153.00,
    "close": 155.50,
    "volume": 1234567
  }
]
```

---

## Dashboard Endpoints

### Get Summary

**GET** `/api/dashboard/summary`

Get portfolio summary and statistics.

**Response:** `200 OK`
```json
{
  "total_strategies": 5,
  "active_strategies": 3,
  "total_orders": 150,
  "open_positions": 8,
  "portfolio_value": 50000.00,
  "total_pnl": 2500.50,
  "pnl_percent": 5.25,
  "win_rate": 65.5
}
```

---

## Rate Limiting

- **General endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **Market data endpoints**: 1000 requests per minute

## Webhooks

Webhooks are available for real-time updates:

- Order status changes
- Position updates
- Price alerts
- Strategy execution events

## SDKs

Official SDKs available for:
- Python
- JavaScript/TypeScript
- Java
- Go

## Support

For API support:
- Email: api-support@tradepro.ai
- Documentation: https://docs.tradepro.ai
- Status: https://status.tradepro.ai