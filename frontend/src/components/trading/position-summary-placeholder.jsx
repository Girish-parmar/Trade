/**
 * Position Summary Placeholder
 * 
 * User portfolio and positions overview
 */

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

const PositionSummaryPlaceholder = () => {
  // Mock positions data
  const positions = [
    {
      symbol: 'RELIANCE',
      quantity: 100,
      avgPrice: 2500.50,
      ltp: 2550.00,
      pnl: 4950.00,
      pnlPercent: 1.98,
    },
    {
      symbol: 'TCS',
      quantity: 50,
      avgPrice: 3600.00,
      ltp: 3580.00,
      pnl: -1000.00,
      pnlPercent: -0.56,
    },
  ];
  
  const totalInvestment = 430025;
  const currentValue = 437500;
  const totalPnL = 7475;
  const pnlPercent = 1.74;
  
  return (
    <div className="space-y-4" data-testid="position-summary-placeholder">
      {/* Portfolio Summary Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Portfolio Summary</h3>
          <DollarSign className="w-6 h-6 opacity-75" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm opacity-90">Total Investment</p>
            <p className="text-2xl font-bold">₹{totalInvestment.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Current Value</p>
            <p className="text-2xl font-bold">₹{currentValue.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-90">Total P&L</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">₹{totalPnL.toLocaleString()}</span>
              <span className={`flex items-center text-sm font-medium ${
                totalPnL >= 0 ? 'text-green-300' : 'text-red-300'
              }`}>
                {totalPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {pnlPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Positions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Open Positions</h3>
          <span className="text-sm text-gray-500">{positions.length} holdings</span>
        </div>
        
        <div className="divide-y divide-gray-100">
          {positions.map((position, idx) => (
            <div key={idx} className="px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-bold text-gray-900">{position.symbol}</h4>
                  <p className="text-xs text-gray-500">
                    {position.quantity} shares @ ₹{position.avgPrice.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ₹{position.ltp.toFixed(2)}
                  </p>
                  <p className={`text-xs font-medium ${
                    position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {position.pnl >= 0 ? '+' : ''}₹{position.pnl.toFixed(2)} ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors">
                  Buy More
                </button>
                <button className="flex-1 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors">
                  Sell
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-center text-gray-400 py-2">
        <p>Placeholder Data - Connect to backend for real positions</p>
      </div>
    </div>
  );
};

export default PositionSummaryPlaceholder;
