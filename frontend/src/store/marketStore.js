/**
 * Market Data Store (Zustand)
 * 
 * Real-time market data state management
 * Updated via WebSocket connections
 * 
 * Features:
 * - Real-time quotes
 * - Order book depth
 * - Recent trades
 * - Price alerts
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useMarketStore = create(
  devtools(
    persist(
      (set, get) => ({
        // Market quotes (symbol -> quote data)
        quotes: {},
        
        // Order book depth (symbol -> {bids, asks})
        orderBooks: {},
        
        // Recent trades (symbol -> trade[])
        recentTrades: {},
        
        // WebSocket connection status
        connectionStatus: 'disconnected',
        
        // Last update timestamp
        lastUpdate: null,
        
        // Actions
        updateQuote: (symbol, quote) => set((state) => ({
          quotes: {
            ...state.quotes,
            [symbol]: {
              ...quote,
              timestamp: new Date().toISOString(),
            },
          },
          lastUpdate: new Date().toISOString(),
        })),
        
        updateOrderBook: (symbol, orderBook) => set((state) => ({
          orderBooks: {
            ...state.orderBooks,
            [symbol]: {
              ...orderBook,
              timestamp: new Date().toISOString(),
            },
          },
          lastUpdate: new Date().toISOString(),
        })),
        
        addTrade: (symbol, trade) => set((state) => {
          const existingTrades = state.recentTrades[symbol] || [];
          return {
            recentTrades: {
              ...state.recentTrades,
              [symbol]: [trade, ...existingTrades].slice(0, 100),
            },
            lastUpdate: new Date().toISOString(),
          };
        }),
        
        setConnectionStatus: (status) => set({ connectionStatus: status }),
        
        clearMarketData: () => set({
          quotes: {},
          orderBooks: {},
          recentTrades: {},
        }),
        
        getQuote: (symbol) => get().quotes[symbol],
        getOrderBook: (symbol) => get().orderBooks[symbol],
        getTrades: (symbol) => get().recentTrades[symbol] || [],
      }),
      {
        name: 'market-storage',
        partialize: (state) => ({
          connectionStatus: state.connectionStatus,
        }),
      }
    ),
    { name: 'MarketStore' }
  )
);

export default useMarketStore;
