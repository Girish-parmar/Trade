import React, { useState, useEffect } from 'react';
import apiClient, { formatApiError } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { TrendUp, TrendDown } from '@phosphor-icons/react';
import { toast } from 'sonner';

const PositionsPage = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const { data } = await apiClient.get('/positions');
      setPositions(data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Loading positions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="positions-page">
      {/* Header */}
      <div className="border-b-2 border-border pb-4">
        <h1 className="text-4xl font-heading font-bold tracking-tighter">Positions</h1>
        <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider mt-1">
          Your current open positions
        </p>
      </div>

      {/* Positions Table */}
      <Card className="border-2 border-border rounded-none shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg font-heading tracking-tight">Open Positions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {positions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-mono text-muted-foreground">No open positions</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">Execute trades to see your positions here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-secondary/30">
                  <tr>
                    <th className="text-left p-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">Symbol</th>
                    <th className="text-right p-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">Quantity</th>
                    <th className="text-right p-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">Avg Price</th>
                    <th className="text-right p-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">Current Price</th>
                    <th className="text-right p-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">P&L</th>
                    <th className="text-right p-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">P&L %</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => (
                    <tr key={position.id} className="border-b border-border hover:bg-secondary/20 transition-base" data-testid={`position-row-${position.id}`}>
                      <td className="p-4 font-mono text-sm font-semibold">{position.symbol}</td>
                      <td className="p-4 font-mono text-sm text-right">{position.quantity}</td>
                      <td className="p-4 font-mono text-sm text-right">${position.avg_price.toFixed(2)}</td>
                      <td className="p-4 font-mono text-sm text-right">${position.current_price.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <span className={`font-mono text-sm font-semibold flex items-center justify-end ${
                          position.pnl >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {position.pnl >= 0 ? <TrendUp className="h-4 w-4 mr-1" /> : <TrendDown className="h-4 w-4 mr-1" />}
                          ${Math.abs(position.pnl).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-mono text-sm font-semibold ${
                          position.pnl_percent >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {position.pnl_percent >= 0 ? '+' : ''}{position.pnl_percent.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PositionsPage;