import React, { useState, useEffect } from 'react';
import apiClient, { formatApiError } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { X } from '@phosphor-icons/react';
import { toast } from 'sonner';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await apiClient.get('/orders');
      setOrders(data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      await apiClient.delete(`/orders/${orderId}`);
      toast.success('Order cancelled');
      fetchOrders();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      filled: 'bg-success text-white',
      pending: 'bg-warning text-foreground',
      cancelled: 'bg-destructive text-white',
      rejected: 'bg-destructive text-white',
      open: 'bg-accent text-white',
    };
    return colors[status] || 'bg-muted text-foreground';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="orders-page">
      {/* Header */}
      <div className="border-b-2 border-border pb-4">
        <h1 className="text-4xl font-heading font-bold tracking-tighter">Orders</h1>
        <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider mt-1">
          View and manage your trading orders
        </p>
      </div>

      {/* Orders Table */}
      <Card className="border-2 border-border rounded-none shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg font-heading tracking-tight">All Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-mono text-muted-foreground">No orders yet</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">Place your first order from the trading terminal</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-secondary/30">
                  <tr>
                    <th className="text-left p-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">Symbol</th>
                    <th className="text-left p-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">Side</th>
                    <th className="text-left p-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">Type</th>
                    <th className="text-right p-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">Quantity</th>
                    <th className="text-right p-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">Price</th>
                    <th className="text-left p-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="text-center p-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-secondary/20 transition-base" data-testid={`order-row-${order.id}`}>
                      <td className="p-4 font-mono text-sm font-semibold">{order.symbol}</td>
                      <td className="p-4">
                        <span className={`font-mono text-sm font-semibold ${
                          order.side === 'buy' ? 'text-success' : 'text-destructive'
                        }`}>
                          {order.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-sm">{order.order_type}</td>
                      <td className="p-4 font-mono text-sm text-right">{order.quantity}</td>
                      <td className="p-4 font-mono text-sm text-right">
                        {order.price ? `$${order.price}` : 'Market'}
                      </td>
                      <td className="p-4">
                        <Badge className={`${getStatusColor(order.status)} rounded-none text-xs font-mono uppercase tracking-wider`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        {order.status === 'pending' || order.status === 'open' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-none border-2 hover:border-destructive hover:text-destructive"
                            onClick={() => cancelOrder(order.id)}
                            data-testid={`cancel-order-${order.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        ) : (
                          <span className="text-xs font-mono text-muted-foreground">-</span>
                        )}
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

export default OrdersPage;