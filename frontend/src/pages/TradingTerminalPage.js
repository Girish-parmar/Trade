import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import apiClient, { formatApiError } from '../lib/api';
import { toast } from 'sonner';
import { TrendUp, TrendDown, ShoppingCart } from '@phosphor-icons/react';

const TradingTerminalPage = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [quote, setQuote] = useState(null);
  const [orderForm, setOrderForm] = useState({
    symbol: 'AAPL',
    side: 'buy',
    quantity: '10',
    price: '',
    order_type: 'market',
    broker_id: '',
  });
  const [brokers, setBrokers] = useState([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    fetchBrokers();
    fetchQuote(selectedSymbol);
    const interval = setInterval(() => fetchQuote(selectedSymbol), 5000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const fetchBrokers = async () => {
    try {
      const { data } = await apiClient.get('/brokers');
      setBrokers(data);
      if (data.length > 0) {
        setOrderForm(prev => ({ ...prev, broker_id: data[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch brokers:', error);
    }
  };

  const fetchQuote = async (symbol) => {
    try {
      const { data } = await apiClient.get(`/market/quote/${symbol}`);
      setQuote(data);
    } catch (error) {
      console.error('Failed to fetch quote:', error);
    }
  };

  const placeOrder = async () => {
    if (!orderForm.broker_id) {
      toast.error('Please connect a broker first');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderData = {
        ...orderForm,
        quantity: parseFloat(orderForm.quantity),
        price: orderForm.price ? parseFloat(orderForm.price) : null,
      };
      
      await apiClient.post('/orders', orderData);
      toast.success('Order placed successfully!');
      setOrderForm(prev => ({ ...prev, quantity: '10', price: '' }));
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const watchlistSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META'];

  return (
    <div className="space-y-6" data-testid="trading-terminal-page">
      {/* Header */}
      <div className="border-b-2 border-border pb-4">
        <h1 className="text-4xl font-heading font-bold tracking-tighter">Trading Terminal</h1>
        <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider mt-1">
          Live Market Data & Order Execution
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quote & Chart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quote Card */}
          <Card className="border-2 border-border rounded-none shadow-none">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-heading tracking-tight">{selectedSymbol}</CardTitle>
                  {quote && (
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="text-3xl font-mono font-bold">${quote.price}</span>
                      <span className={`flex items-center text-lg font-mono font-semibold ${
                        quote.change >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {quote.change >= 0 ? <TrendUp className="h-5 w-5 mr-1" /> : <TrendDown className="h-5 w-5 mr-1" />}
                        {quote.change >= 0 ? '+' : ''}{quote.change} ({quote.change_percent}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-4 gap-4 text-sm font-mono">
                {quote && [
                  { label: 'Open', value: `$${quote.open}` },
                  { label: 'High', value: `$${quote.high}` },
                  { label: 'Low', value: `$${quote.low}` },
                  { label: 'Volume', value: quote.volume.toLocaleString() },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className="font-semibold mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chart Placeholder */}
          <Card className="border-2 border-border rounded-none shadow-none">
            <CardContent className="p-12 text-center bg-secondary/20">
              <p className="text-sm font-mono text-muted-foreground">Chart visualization will be displayed here</p>
              <p className="text-xs font-mono text-muted-foreground mt-2">Real-time price chart with TradingView</p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Order Form & Watchlist */}
        <div className="space-y-4">
          {/* Order Form */}
          <Card className="border-2 border-border rounded-none shadow-none">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg font-heading tracking-tight flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Place Order
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs defaultValue="buy" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none border-2 border-border p-0">
                  <TabsTrigger 
                    value="buy" 
                    className="rounded-none data-[state=active]:bg-success data-[state=active]:text-white font-mono text-xs uppercase tracking-wider"
                    onClick={() => setOrderForm(prev => ({ ...prev, side: 'buy' }))}
                    data-testid="buy-tab"
                  >
                    Buy
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sell" 
                    className="rounded-none data-[state=active]:bg-destructive data-[state=active]:text-white font-mono text-xs uppercase tracking-wider"
                    onClick={() => setOrderForm(prev => ({ ...prev, side: 'sell' }))}
                    data-testid="sell-tab"
                  >
                    Sell
                  </TabsTrigger>
                </TabsList>

                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-xs font-mono uppercase tracking-wider">Symbol</Label>
                    <Input
                      value={orderForm.symbol}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                      className="rounded-none border-2 font-mono"
                      data-testid="order-symbol-input"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-mono uppercase tracking-wider">Order Type</Label>
                    <Select 
                      value={orderForm.order_type} 
                      onValueChange={(value) => setOrderForm(prev => ({ ...prev, order_type: value }))}
                    >
                      <SelectTrigger className="rounded-none border-2 font-mono" data-testid="order-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">Market</SelectItem>
                        <SelectItem value="limit">Limit</SelectItem>
                        <SelectItem value="stop_loss">Stop Loss</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-mono uppercase tracking-wider">Quantity</Label>
                    <Input
                      type="number"
                      value={orderForm.quantity}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, quantity: e.target.value }))}
                      className="rounded-none border-2 font-mono"
                      data-testid="order-quantity-input"
                    />
                  </div>

                  {orderForm.order_type === 'limit' && (
                    <div>
                      <Label className="text-xs font-mono uppercase tracking-wider">Limit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={orderForm.price}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, price: e.target.value }))}
                        className="rounded-none border-2 font-mono"
                        data-testid="order-price-input"
                      />
                    </div>
                  )}

                  <Button
                    className={`w-full rounded-none font-mono text-xs uppercase tracking-wider ${
                      orderForm.side === 'buy' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'
                    }`}
                    onClick={placeOrder}
                    disabled={isPlacingOrder || brokers.length === 0}
                    data-testid="place-order-button"
                  >
                    {isPlacingOrder ? 'Placing...' : `Place ${orderForm.side.toUpperCase()} Order`}
                  </Button>

                  {brokers.length === 0 && (
                    <p className="text-xs font-mono text-destructive text-center">Connect a broker to start trading</p>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Watchlist */}
          <Card className="border-2 border-border rounded-none shadow-none">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg font-heading tracking-tight">Watchlist</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {watchlistSymbols.map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => {
                      setSelectedSymbol(symbol);
                      setOrderForm(prev => ({ ...prev, symbol }));
                    }}
                    className={`w-full p-3 border-2 transition-base text-left ${
                      selectedSymbol === symbol
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary'
                    }`}
                    data-testid={`watchlist-${symbol}`}
                  >
                    <p className="font-mono text-sm font-semibold">{symbol}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TradingTerminalPage;