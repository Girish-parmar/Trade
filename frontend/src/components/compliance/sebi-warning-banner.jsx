/**
 * SEBI Warning Banner
 * 
 * Non-dismissible regulatory warning (SEBI requirement)
 * Can be minimized but always visible
 * 
 * WCAG Compliance:
 * - High contrast colors
 * - Keyboard accessible
 * - Screen reader friendly
 */

import React from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import useComplianceStore from '@/store/complianceStore';

const SebiWarningBanner = () => {
  const { sebiWarningMinimized, minimizeSebiWarning, expandSebiWarning } = useComplianceStore();
  
  const toggleMinimize = () => {
    if (sebiWarningMinimized) {
      expandSebiWarning();
    } else {
      minimizeSebiWarning();
    }
  };
  
  return (
    <div
      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
      role="alert"
      aria-live="polite"
      data-testid="sebi-warning-banner"
    >
      <div className="max-w-7xl mx-auto">
        {/* Minimized State */}
        {sebiWarningMinimized ? (
          <button
            onClick={toggleMinimize}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset"
            aria-label="Expand SEBI regulatory warning"
            aria-expanded="false"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm font-medium">
                SEBI Regulatory Notice
              </span>
            </div>
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : (
          /* Expanded State */
          <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                  <h3 className="text-sm font-bold">
                    SEBI Regulatory Warning
                  </h3>
                </div>
                
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    ⚠️ Trading in securities is subject to market risks. Read all related documents carefully before investing.
                  </p>
                  
                  <ul className="list-disc list-inside space-y-0.5 text-xs mt-2 opacity-95">
                    <li>Investments in securities market are subject to market risks</li>
                    <li>Past performance is not indicative of future returns</li>
                    <li>Please read all scheme related documents carefully before investing</li>
                    <li>Registration granted by SEBI does not imply recommendation</li>
                  </ul>
                  
                  <p className="text-xs mt-2 opacity-90">
                    <Info className="w-3 h-3 inline mr-1" aria-hidden="true" />
                    This platform is subject to SEBI regulations. For grievances, contact: compliance@tradepro.in
                  </p>
                </div>
              </div>
              
              <button
                onClick={toggleMinimize}
                className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Minimize SEBI regulatory warning"
                aria-expanded="true"
              >
                <ChevronUp className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SebiWarningBanner;
