# TRADEPRO AI - Enterprise Multi-Broker Trading Platform

## Overview

TradePro AI is a comprehensive enterprise-grade trading platform that enables users to:
- Connect multiple broker accounts
- Build visual trading strategies with drag-and-drop interface
- Execute trades across different brokers
- Monitor positions and portfolio performance
- Analyze trading performance with detailed analytics

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: MongoDB
- **Authentication**: JWT with HTTP-only cookies
- **Password Hashing**: bcrypt

### Frontend
- **Framework**: React 19
- **Routing**: React Router v7
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **UI Components**: shadcn/ui (Radix UI)
- **Styling**: TailwindCSS
- **Strategy Builder**: React Flow
- **Charts**: Recharts
- **Icons**: Phosphor Icons
- **Notifications**: Sonner

## Features

### Authentication
- ✅ Email/Password registration and login
- ✅ JWT token authentication with refresh tokens
- ✅ HTTP-only cookie storage
- ✅ Protected routes
- ✅ Session management

### Trading
- ✅ Multi-broker account management (Zerodha, Upstox, Binance, Interactive Brokers, Alpaca)
- ✅ Real-time market data (mock)
- ✅ Order placement (Market, Limit, Stop Loss)
- ✅ Order management and tracking
- ✅ Position monitoring
- ✅ Watchlist functionality

### Strategy Builder
- ✅ Visual strategy builder with React Flow
- ✅ Drag-and-drop node system
- ✅ Indicator nodes (RSI, MA, MACD, Bollinger Bands)
- ✅ Condition nodes (Greater Than, Less Than, Crosses)
- ✅ Action nodes (Buy, Sell, Close Position)
- ✅ Strategy versioning
- ✅ Strategy library

### Analytics
- ✅ Portfolio dashboard
- ✅ Performance metrics
- ✅ P&L tracking
- ✅ Win rate calculation
- 🚧 Advanced analytics (coming soon)

### Admin
- ✅ User management
- ✅ Audit logging
- ✅ Broker configuration

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB

### Installation

1. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Update .env with your configuration
python -m uvicorn server:app --reload --port 8001
```

2. **Frontend Setup**
```bash
cd frontend
yarn install
cp .env.example .env
# Update .env with your backend URL
yarn start
```

### Default Credentials

**Admin Account**
- Email: admin@tradepro.com
- Password: admin123

## Project Structure

```
/app
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── utils/                 # Utility functions
│   ├── .env                   # Environment variables
│   └── requirements.txt       # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── layout/       # Layout components
│   │   │   └── ProtectedRoute.js
│   │   ├── pages/            # Page components
│   │   ├── stores/           # Zustand stores
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities
│   │   ├── App.js            # Main app component
│   │   └── index.css         # Global styles
│   ├── package.json          # Node dependencies
│   └── tailwind.config.js    # Tailwind configuration
│
└── memory/
    └── test_credentials.md    # Test credentials
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Brokers
- `GET /api/brokers` - List connected brokers
- `POST /api/brokers` - Connect new broker
- `DELETE /api/brokers/{id}` - Disconnect broker

### Strategies
- `GET /api/strategies` - List strategies
- `POST /api/strategies` - Create strategy
- `GET /api/strategies/{id}` - Get strategy details
- `PUT /api/strategies/{id}` - Update strategy
- `DELETE /api/strategies/{id}` - Delete strategy

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Place order
- `DELETE /api/orders/{id}` - Cancel order

### Positions
- `GET /api/positions` - List positions

### Market Data
- `GET /api/market/quote/{symbol}` - Get real-time quote
- `GET /api/market/candles/{symbol}` - Get historical candles

### Dashboard
- `GET /api/dashboard/summary` - Get portfolio summary

## Design System

### Colors
- **Primary**: Black (#0A0A0A)
- **Accent**: Signal Blue (#0055FF)
- **Success**: Mint Green (#00C853)
- **Warning**: Yellow (#FFD600)
- **Error**: Red (#FF3B30)

### Typography
- **Headings**: Cabinet Grotesk
- **Body/Data**: IBM Plex Mono

### Design Philosophy
Swiss & High-Contrast aesthetic with a light theme. Objective, rigid, functional design that acts as a highly disciplined command center. Stark contrasts and tabular accuracy prioritized over decorative elements.

## Security Features

- JWT authentication with 15-minute access tokens
- Refresh tokens with 7-day expiry
- HTTP-only cookies for token storage
- bcrypt password hashing with salt
- CORS protection
- Input validation
- SQL injection prevention (parameterized queries)
- API rate limiting ready

## Testing

### Backend Testing
```bash
cd backend
pytest
```

### Frontend Testing
```bash
cd frontend
yarn test
```

## Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Environment Variables

**Backend (.env)**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=tradepro_db
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@tradepro.com
ADMIN_PASSWORD=admin123
```

**Frontend (.env)**
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Roadmap

### Phase 1 (Current)
- ✅ Core authentication
- ✅ Multi-broker integration
- ✅ Visual strategy builder
- ✅ Order execution
- ✅ Basic analytics

### Phase 2 (Upcoming)
- 🚧 Backtesting engine
- 🚧 Advanced analytics
- 🚧 Real-time WebSocket data
- 🚧 Paper trading mode
- 🚧 Mobile app

### Phase 3 (Future)
- 🚧 AI-powered strategy suggestions
- 🚧 Social trading features
- 🚧 Advanced risk management
- 🚧 Tax reporting
- 🚧 API for third-party integrations

## Support

For issues and feature requests, please visit our GitHub repository.

## License

Proprietary - All rights reserved

## Contributors

Built with ❤️ by the TradePro AI team
