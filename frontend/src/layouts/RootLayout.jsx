/**
 * Root Layout Component
 * 
 * Global providers and error boundary wrapper
 * WebSocket connection management
 */

import React from 'react';
import ErrorBoundary from '@/components/common/error-boundary';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import SebiWarningBanner from '@/components/compliance/sebi-warning-banner';

const RootLayout = ({ children }) => {
  return (
    <ErrorBoundary>
      <WebSocketProvider>
        <div className="min-h-screen bg-gray-50">
          {/* SEBI Regulatory Warning Banner (Always visible - non-dismissible) */}
          <SebiWarningBanner />
          
          {/* Main Content */}
          <main className="relative">
            {children}
          </main>
        </div>
      </WebSocketProvider>
    </ErrorBoundary>
  );
};

export default RootLayout;
