import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ChartBar } from '@phosphor-icons/react';

const AnalyticsPage = () => {
  return (
    <div className="space-y-6" data-testid="analytics-page">
      {/* Header */}
      <div className="border-b-2 border-border pb-4">
        <h1 className="text-4xl font-heading font-bold tracking-tighter">Analytics</h1>
        <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider mt-1">
          Performance metrics and trading insights
        </p>
      </div>

      {/* Content */}
      <Card className="border-2 border-border rounded-none shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg font-heading tracking-tight flex items-center">
            <ChartBar className="h-5 w-5 mr-2" />
            Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <p className="text-sm font-mono text-muted-foreground">Analytics dashboard coming soon</p>
          <p className="text-xs font-mono text-muted-foreground mt-2">Track your trading performance with detailed charts and metrics</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;