# Phase 2 - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Frontend
```bash
cd /app/frontend
yarn start
# Frontend runs on http://localhost:3000
```

### 2. Access the Application

**Landing Page:**
- Navigate to: `http://localhost:3000/`
- Click **"Demo Login (Trader)"** for full trading access
- Click **"Demo Login (Viewer)"** for read-only access

**Trading Dashboard:**
- After demo login, you'll be redirected to `/dashboard`
- Complete risk disclaimer modal (scroll to bottom, check boxes)
- Explore the trading interface

## 📋 Features to Test

### Compliance Components

**SEBI Warning Banner (Top of page):**
- Always visible (non-dismissible)
- Click collapse/expand arrow
- ✅ Minimized state remembered

**Risk Disclaimer Modal:**
- Appears on first login
- Must scroll to bottom to enable checkboxes
- Must check both boxes to acknowledge
- ✅ Acknowledgment persists across sessions

### Trading Dashboard

**Symbol Selector:**
- Switch between RELIANCE, TCS, INFY, HDFC, ICICIBANK
- Chart and order book update accordingly

**Price Chart:**
- View mock price data
- Switch timeframes (1D, 1W, 1M, 3M, 1Y)
- Responsive Recharts visualization

**Order Book:**
- Real-time bid/ask depth (placeholder data)
- Color-coded (green=bids, red=asks)
- Spread calculation
- Volume bars

**Quick Trade Panel:**
- Buy/Sell order forms
- Disabled if not authenticated
- Shows "Complete KYC to Trade" for viewers

**Position Summary:**
- Portfolio overview card
- P&L tracking (color-coded)
- Open positions list
- Quick buy/sell actions

### State Management

**User Session (Persisted):**
```javascript
import useUserSessionStore from '@/store/userSessionStore';

const { user, isAuthenticated, canTrade, logout } = useUserSessionStore();

// Check if user can trade
if (canTrade()) {
  // Enable trading UI
}

// Logout
logout();
```

**Market Data (Real-time):**
```javascript
import useMarketStore from '@/store/marketStore';

const { getQuote, connectionStatus } = useMarketStore();

const quote = getQuote('RELIANCE');
// { price, change, volume, timestamp }
```

**Compliance:**
```javascript
import useComplianceStore from '@/store/complianceStore';

const { riskDisclaimerAcknowledged, canPlaceOrder } = useComplianceStore();

if (!canPlaceOrder()) {
  // Show compliance modal
}
```

### Layouts & Navigation

**Sidebar:**
- Collapse/expand toggle
- Navigation: Dashboard, Trading, Portfolio, Compliance, Settings
- User profile section
- KYC status badge
- Trading status badge
- Logout button

**Header:**
- Search bar (placeholder)
- Connection status indicator (Live/Offline/Reconnecting)
- Compliance flags icon (when flags exist)
- Notifications bell
- User menu

### Responsive Design

**Test on different screen sizes:**
- Mobile (< 640px): Sidebar collapses, grid stacks
- Tablet (640px - 1024px): Optimized layout
- Desktop (> 1024px): Full layout with sidebar

## 🔧 Customization

### Change Default Symbol
```javascript
// In TradingDashboard.jsx
const [selectedSymbol, setSelectedSymbol] = useState('TCS');
```

### Add New Navigation Item
```javascript
// In DashboardLayout.jsx
const navigation = [
  // ... existing items
  { name: 'Reports', icon: FileText, href: '/reports', current: false },
];
```

### Modify Color Scheme
```javascript
// Tailwind colors in components
className="bg-blue-600" // Primary blue
className="bg-green-600" // Success/Buy
className="bg-red-600" // Danger/Sell
className="bg-gray-900" // Dark background
```

## 🧪 Testing Components

### Test Data IDs
All interactive elements have `data-testid` attributes:

```javascript
// Find elements in tests
screen.getByTestId('sebi-warning-banner')
screen.getByTestId('risk-disclaimer-modal')
screen.getByTestId('order-book-placeholder')
screen.getByTestId('buy-button')
screen.getByTestId('sell-button')
screen.getByTestId('demo-login-button')
```

### Example Jest Test
```javascript
import { render, screen } from '@testing-library/react';
import TradingDashboard from '@/pages/TradingDashboard';

test('renders trading dashboard', () => {
  render(<TradingDashboard />);
  expect(screen.getByTestId('trading-dashboard')).toBeInTheDocument();
});
```

## 🔌 WebSocket Integration (Future)

When backend WebSocket is ready:

```javascript
// Update environment variable
REACT_APP_WEBSOCKET_URL=ws://localhost:8001/ws

// WebSocket will auto-connect on authentication
// Subscribe to channels:
const { subscribe } = useWebSocket();
subscribe(['quotes:RELIANCE', 'orderbook:RELIANCE', 'trades:RELIANCE']);
```

## 🎨 Adding New Components

### Create Trading Component
```javascript
// /app/frontend/src/components/trading/MyComponent.jsx
import React from 'react';

const MyComponent = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4" data-testid="my-component">
      <h3 className="text-lg font-bold mb-4">My Component</h3>
      {/* Component content */}
    </div>
  );
};

export default MyComponent;
```

### Add to Dashboard
```javascript
// In TradingDashboard.jsx
import MyComponent from '@/components/trading/MyComponent';

// Add to layout
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <div className="lg:col-span-12">
    <MyComponent />
  </div>
</div>
```

## 📱 Mobile Testing

### Browser DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select device: iPhone, iPad, etc.
4. Test touch interactions

### Real Device
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Access: `http://YOUR_IP:3000`
3. Test on mobile browser

## 🐛 Troubleshooting

### Frontend won't start
```bash
# Check Node version (need 16+)
node --version

# Clear cache and reinstall
cd /app/frontend
rm -rf node_modules yarn.lock
yarn install
yarn start
```

### Stores not persisting
```bash
# Clear browser localStorage
localStorage.clear()

# Or in DevTools:
Application > Local Storage > Clear All
```

### WebSocket connection fails
```bash
# Check backend WebSocket endpoint
# Ensure REACT_APP_WEBSOCKET_URL is correct
# Backend must have WebSocket endpoint at /ws
```

### Compliance modal not showing
```javascript
// Clear compliance acknowledgment
useComplianceStore.getState().resetSessionCompliance();

// Or clear localStorage
localStorage.removeItem('compliance-storage');
```

## 📚 Key Files Reference

**Stores:**
- `/app/frontend/src/store/marketStore.js`
- `/app/frontend/src/store/userSessionStore.js`
- `/app/frontend/src/store/complianceStore.js`

**Layouts:**
- `/app/frontend/src/layouts/RootLayout.jsx`
- `/app/frontend/src/layouts/DashboardLayout.jsx`

**Pages:**
- `/app/frontend/src/pages/TradingDashboard.jsx`
- `/app/frontend/src/App.js`

**Compliance:**
- `/app/frontend/src/components/compliance/sebi-warning-banner.jsx`
- `/app/frontend/src/components/compliance/risk-disclaimer-modal.jsx`

**Trading:**
- `/app/frontend/src/components/trading/price-chart-placeholder.jsx`
- `/app/frontend/src/components/trading/order-book-placeholder.jsx`
- `/app/frontend/src/components/trading/position-summary-placeholder.jsx`

## 🚀 Next Development Steps

1. **Backend Integration:**
   - Connect authentication API
   - Implement real order placement
   - WebSocket backend setup

2. **Additional Pages:**
   - KYC upload page
   - Order history
   - Settings & preferences
   - Compliance dashboard

3. **Advanced Features:**
   - Real-time chart updates
   - Advanced order types (TWAP, VWAP)
   - Algo strategy builder UI
   - Portfolio analytics

4. **Testing:**
   - Unit tests (Jest)
   - Integration tests
   - E2E tests (Playwright)
   - Accessibility tests

---

**Phase 2 Status:** ✅ Complete and fully functional
**Ready for:** Backend integration and feature expansion
