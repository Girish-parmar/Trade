import React, { useEffect, useState } from 'react';
import apiClient from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  TrendUp, 
  TrendDown, 
  ChartLine, 
  Wallet, 
  Target,
  Lightning
} from '@phosphor-icons/react';

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data } = await apiClient.get('/dashboard/summary');
        setSummary(data);
      } catch (error) {
        console.error('Failed to fetch dashboard summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Portfolio Value',
      value: `$${summary?.portfolio_value?.toLocaleString() || '0'}`,
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total P&L',
      value: `$${summary?.total_pnl?.toFixed(2) || '0'}`,
      change: `${summary?.pnl_percent?.toFixed(2) || '0'}%`,
      icon: summary?.total_pnl >= 0 ? TrendUp : TrendDown,
      color: summary?.total_pnl >= 0 ? 'text-success' : 'text-destructive',
      bgColor: summary?.total_pnl >= 0 ? 'bg-success/10' : 'bg-destructive/10',
    },
    {
      title: 'Active Strategies',
      value: summary?.active_strategies || 0,
      subtitle: `${summary?.total_strategies || 0} Total`,
      icon: Lightning,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Win Rate',
      value: `${summary?.win_rate?.toFixed(1) || '0'}%`,
      icon: Target,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Page Header */}
      <div className="border-b-2 border-border pb-4">
        <h1 className="text-4xl font-heading font-bold tracking-tighter">Dashboard</h1>
        <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider mt-1">
          Portfolio Overview & Performance Metrics
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="border-2 border-border rounded-none shadow-none hover:border-primary transition-base" data-testid={`metric-card-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                      {metric.title}
                    </p>
                    <p className="text-3xl font-heading font-bold tracking-tight mb-1">
                      {metric.value}
                    </p>
                    {metric.change && (
                      <p className={`text-sm font-mono font-semibold ${metric.color}`}>
                        {metric.change}
                      </p>
                    )}
                    {metric.subtitle && (
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        {metric.subtitle}
                      </p>
                    )}
                  </div>
                  <div className={`p-3 ${metric.bgColor} ${metric.color}`}>
                    <Icon className="h-6 w-6" weight="bold" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border-2 border-border rounded-none shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg font-heading tracking-tight flex items-center">
              <ChartLine className="h-5 w-5 mr-2" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="font-mono text-sm font-semibold">AAPL</p>
                    <p className="text-xs font-mono text-muted-foreground">BUY · Market</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">10 shares</p>
                    <p className="text-xs font-mono text-success">Filled</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Open Positions */}
        <Card className="border-2 border-border rounded-none shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg font-heading tracking-tight flex items-center">
              <Wallet className="h-5 w-5 mr-2" />
              Open Positions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <p className="text-sm font-mono text-muted-foreground">No open positions</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">Start trading to see your positions here</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-2 border-border rounded-none shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg font-heading tracking-tight">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'New Strategy', link: '/strategies' },
              { label: 'Place Order', link: '/terminal' },
              { label: 'View Analytics', link: '/analytics' },
              { label: 'Manage Brokers', link: '/settings' },
            ].map((action, i) => (
              <a
                key={i}
                href={action.link}
                className="p-4 border-2 border-border hover:border-primary hover:bg-primary hover:text-primary-foreground transition-base text-center"
                data-testid={`quick-action-${i}`}
              >
                <p className="text-xs font-mono font-semibold uppercase tracking-wider">{action.label}</p>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;