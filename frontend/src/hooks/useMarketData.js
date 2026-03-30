import { useState, useEffect } from 'react';
import apiClient from '../lib/api';

const useMarketData = (symbol, interval = 5000) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    const fetchQuote = async () => {
      try {
        const { data } = await apiClient.get(`/market/quote/${symbol}`);
        setQuote(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
    const intervalId = setInterval(fetchQuote, interval);

    return () => clearInterval(intervalId);
  }, [symbol, interval]);

  return { quote, loading, error };
};

export default useMarketData;