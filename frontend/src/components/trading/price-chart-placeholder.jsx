/**
 * Price Chart Placeholder
 * 
 * Candlestick/Line chart for price visualization
 * Placeholder for Recharts integration
 */

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const PriceChartPlaceholder = ({ symbol = 'RELIANCE' }) => {
  const [timeframe, setTimeframe] = useState('1D');
  
  // Mock price data
  const mockData = [
    { time: '09:15', price: 2525 },
    { time: '10:00', price: 2530 },
    { time: '11:00', price: 2528 },
    { time: '12:00', price: 2535 },
    { time: '13:00', price: 2540 },
    { time: '14:00', price: 2538 },
    { time: '15:00', price: 2545 },
    { time: '15:30', price: 2550 },
  ];
  
  return (
    <div className="bg-white rounded-lg shadow p-4" data-testid="price-chart-placeholder">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{symbol}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900">2,550.00</span>
            <span className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              +25.00 (+0.99%)
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {['1D', '1W', '1M', '3M', '1Y'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-sm font-medium rounded ${
                timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors`}
              data-testid={`timeframe-${tf}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              domain={['dataMin - 5', 'dataMax + 5']}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-3 text-xs text-center text-gray-400">
        <p>Placeholder Chart - Real-time data via WebSocket integration</p>
      </div>
    </div>
  );
};

export default PriceChartPlaceholder;
