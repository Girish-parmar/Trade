/**
 * Order Book Placeholder
 * 
 * Real-time order book depth display
 * Will be populated with WebSocket data
 */

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import useMarketStore from '@/store/marketStore';

const OrderBookPlaceholder = ({ symbol = 'RELIANCE' }) => {
  const { getOrderBook } = useMarketStore();
  const orderBook = getOrderBook(symbol);
  
  // Mock data for placeholder
  const mockBids = [
    { price: 2549.50, quantity: 500, total: 1274750 },
    { price: 2549.00, quantity: 1000, total: 2549000 },
    { price: 2548.50, quantity: 750, total: 1911375 },
    { price: 2548.00, quantity: 2000, total: 5096000 },
    { price: 2547.50, quantity: 1500, total: 3821250 },
  ];
  
  const mockAsks = [
    { price: 2550.00, quantity: 300, total: 765000 },
    { price: 2550.50, quantity: 800, total: 2040400 },
    { price: 2551.00, quantity: 1200, total: 3061200 },
    { price: 2551.50, quantity: 600, total: 1530900 },
    { price: 2552.00, quantity: 1500, total: 3828000 },
  ];
  
  const bids = orderBook?.bids || mockBids;
  const asks = orderBook?.asks || mockAsks;
  
  return (
    <div className="bg-white rounded-lg shadow p-4" data-testid="order-book-placeholder">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Order Book</h3>
        <span className="text-sm text-gray-500">{symbol}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 mb-2">
        <div>Price</div>
        <div className="text-right">Quantity</div>
        <div className="text-right">Total</div>
      </div>
      
      {/* Asks (Sell Orders) */}
      <div className="space-y-1 mb-3">
        {asks.slice(0, 5).reverse().map((ask, idx) => (
          <div
            key={`ask-${idx}`}
            className="grid grid-cols-3 gap-2 text-sm relative"
          >
            <div
              className="absolute inset-0 bg-red-50"
              style={{ width: `${(ask.quantity / Math.max(...asks.map(a => a.quantity))) * 100}%` }}
            />
            <div className="relative text-red-600 font-medium">{ask.price.toFixed(2)}</div>
            <div className="relative text-right text-gray-700">{ask.quantity}</div>
            <div className="relative text-right text-gray-500 text-xs">
              {ask.total.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      
      {/* Spread */}
      <div className="py-2 px-3 bg-gray-100 rounded flex items-center justify-between text-sm font-medium">
        <span className="text-gray-600">Spread</span>
        <span className="text-gray-900">
          {(asks[0]?.price - bids[0]?.price).toFixed(2)} ({(((asks[0]?.price - bids[0]?.price) / bids[0]?.price) * 100).toFixed(3)}%)
        </span>
      </div>
      
      {/* Bids (Buy Orders) */}
      <div className="space-y-1 mt-3">
        {bids.slice(0, 5).map((bid, idx) => (
          <div
            key={`bid-${idx}`}
            className="grid grid-cols-3 gap-2 text-sm relative"
          >
            <div
              className="absolute inset-0 bg-green-50"
              style={{ width: `${(bid.quantity / Math.max(...bids.map(b => b.quantity))) * 100}%` }}
            />
            <div className="relative text-green-600 font-medium">{bid.price.toFixed(2)}</div>
            <div className="relative text-right text-gray-700">{bid.quantity}</div>
            <div className="relative text-right text-gray-500 text-xs">
              {bid.total.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      
      {!orderBook && (
        <div className="mt-3 text-xs text-center text-gray-400">
          <p>Placeholder Data - Connect WebSocket for live updates</p>
        </div>
      )}
    </div>
  );
};

export default OrderBookPlaceholder;
