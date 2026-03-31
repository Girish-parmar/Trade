/**
 * Trading Dashboard Page
 * 
 * Main trading view with charts, order book, and positions
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import PriceChartPlaceholder from '@/components/trading/price-chart-placeholder';
import OrderBookPlaceholder from '@/components/trading/order-book-placeholder';
import PositionSummaryPlaceholder from '@/components/trading/position-summary-placeholder';
import RiskDisclaimerModal from '@/components/compliance/risk-disclaimer-modal';
import useComplianceStore from '@/store/complianceStore';
import useUserSessionStore from '@/store/userSessionStore';

const TradingDashboard = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE');
  const [showRiskDisclaimer, setShowRiskDisclaimer] = useState(false);
  
  const { riskDisclaimerAcknowledged } = useComplianceStore();
  const { isAuthenticated, canTrade } = useUserSessionStore();
  
  useEffect(() => {
    // Show risk disclaimer modal if not acknowledged
    if (isAuthenticated && !riskDisclaimerAcknowledged) {
      setShowRiskDisclaimer(true);
    }
  }, [isAuthenticated, riskDisclaimerAcknowledged]);
  
  const popularSymbols = ['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICIBANK'];
  
  return (
    <>
      <div className="p-6 space-y-6" data-testid="trading-dashboard">
        {/* Symbol Selector */}
        <div className="flex items-center gap-4 bg-white rounded-lg shadow px-4 py-3">
          <span className="text-sm font-medium text-gray-700">Watching:</span>
          <div className="flex gap-2">
            {popularSymbols.map((symbol) => (
              <button
                key={symbol}
                onClick={() => setSelectedSymbol(symbol)}
                className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                  selectedSymbol === symbol
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-testid={`symbol-${symbol}`}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Chart & Quick Trade */}
          <div className="lg:col-span-8 space-y-6">
            {/* Price Chart */}
            <PriceChartPlaceholder symbol={selectedSymbol} />
            
            {/* Quick Trade Panel */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Trade</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Buy Panel */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-600 mb-3">BUY</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Quantity</label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={!canTrade()}
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Price</label>
                      <input
                        type="number"
                        placeholder="Market"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={!canTrade()}
                      />
                    </div>
                    
                    <button
                      className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      disabled={!canTrade()}
                      data-testid="buy-button"
                    >
                      {canTrade() ? 'Place Buy Order' : 'Complete KYC to Trade'}
                    </button>
                  </div>
                </div>
                
                {/* Sell Panel */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-600 mb-3">SELL</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Quantity</label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                        disabled={!canTrade()}
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Price</label>
                      <input
                        type="number"
                        placeholder="Market"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                        disabled={!canTrade()}
                      />
                    </div>
                    
                    <button
                      className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      disabled={!canTrade()}
                      data-testid="sell-button"
                    >
                      {canTrade() ? 'Place Sell Order' : 'Complete KYC to Trade'}
                    </button>
                  </div>
                </div>
              </div>
              
              {!canTrade() && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  ℹ️ Complete your KYC verification to start trading. Visit the Compliance section.
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Order Book & Positions */}
          <div className="lg:col-span-4 space-y-6">
            <OrderBookPlaceholder symbol={selectedSymbol} />
            <PositionSummaryPlaceholder />
          </div>
        </div>
      </div>
      
      {/* Risk Disclaimer Modal */}
      <RiskDisclaimerModal
        isOpen={showRiskDisclaimer}
        onClose={() => setShowRiskDisclaimer(false)}
      />
    </>
  );
};

export default TradingDashboard;
