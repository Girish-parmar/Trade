import { create } from 'zustand';

const useTradingStore = create((set, get) => ({
  selectedSymbol: 'AAPL',
  watchlist: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'],
  positions: [],
  orders: [],
  
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  
  addToWatchlist: (symbol) => {
    const { watchlist } = get();
    if (!watchlist.includes(symbol)) {
      set({ watchlist: [...watchlist, symbol] });
    }
  },
  
  removeFromWatchlist: (symbol) => {
    const { watchlist } = get();
    set({ watchlist: watchlist.filter(s => s !== symbol) });
  },
  
  setPositions: (positions) => set({ positions }),
  setOrders: (orders) => set({ orders }),
}));

export default useTradingStore;