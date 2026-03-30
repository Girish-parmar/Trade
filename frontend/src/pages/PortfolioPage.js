import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FolderOpen } from '@phosphor-icons/react';

const PortfolioPage = () => {
  return (
    <div className="space-y-6" data-testid="portfolio-page">
      {/* Header */}
      <div className="border-b-2 border-border pb-4">
        <h1 className="text-4xl font-heading font-bold tracking-tighter">Portfolio</h1>
        <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider mt-1">
          Comprehensive portfolio overview and allocation
        </p>
      </div>

      {/* Content */}
      <Card className="border-2 border-border rounded-none shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg font-heading tracking-tight flex items-center">
            <FolderOpen className="h-5 w-5 mr-2" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <p className="text-sm font-mono text-muted-foreground">Portfolio details coming soon</p>
          <p className="text-xs font-mono text-muted-foreground mt-2">View holdings, allocations, and performance history</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioPage;