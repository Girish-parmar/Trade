import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Crosshair } from '@phosphor-icons/react';

const ScreenerPage = () => {
  return (
    <div className="space-y-6" data-testid="screener-page">
      {/* Header */}
      <div className="border-b-2 border-border pb-4">
        <h1 className="text-4xl font-heading font-bold tracking-tighter">Market Screener</h1>
        <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider mt-1">
          Scan and filter stocks based on technical indicators
        </p>
      </div>

      {/* Content */}
      <Card className="border-2 border-border rounded-none shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg font-heading tracking-tight flex items-center">
            <Crosshair className="h-5 w-5 mr-2" />
            Stock Screener
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <p className="text-sm font-mono text-muted-foreground">Screener functionality coming soon</p>
          <p className="text-xs font-mono text-muted-foreground mt-2">Filter stocks by price, volume, indicators, and more</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScreenerPage;