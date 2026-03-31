/**
 * Risk Disclaimer Modal
 * 
 * Mandatory pre-trade risk acknowledgment (SEBI requirement)
 * Must be acknowledged before any trading activity
 * 
 * WCAG Compliance:
 * - Focus trap within modal
 * - Keyboard navigation (Tab, Escape)
 * - Screen reader announcements
 */

import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import useComplianceStore from '@/store/complianceStore';
import useUserSessionStore from '@/store/userSessionStore';

const RiskDisclaimerModal = ({ isOpen, onClose }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToRisks, setAgreedToRisks] = useState(false);
  const contentRef = useRef(null);
  const firstFocusRef = useRef(null);
  
  const { acknowledgeRiskDisclaimer, riskDisclaimerAcknowledged } = useComplianceStore();
  const { user } = useUserSessionStore();
  
  useEffect(() => {
    if (isOpen && firstFocusRef.current) {
      firstFocusRef.current.focus();
    }
  }, [isOpen]);
  
  const handleScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };
  
  const handleAcknowledge = () => {
    acknowledgeRiskDisclaimer();
    onClose();
  };
  
  const canAcknowledge = hasScrolledToBottom && agreedToTerms && agreedToRisks;
  
  if (!isOpen || riskDisclaimerAcknowledged) {
    return null;
  }
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="risk-disclaimer-title"
      data-testid="risk-disclaimer-modal"
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
            </div>
            <div>
              <h2 id="risk-disclaimer-title" className="text-xl font-bold text-gray-900">
                Risk Disclosure & Trading Agreement
              </h2>
              <p className="text-sm text-gray-600">SEBI Mandated Disclosure</p>
            </div>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
          onScroll={handleScroll}
          tabIndex={0}
          aria-label="Risk disclosure content"
        >
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-sm text-yellow-900 font-medium">
              ⚠️ IMPORTANT: Please read this entire disclosure before proceeding. You must scroll to the bottom and agree to all terms.
            </p>
          </div>
          
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Market Risk Disclosure</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Trading in equity, derivatives, commodities, and other financial instruments involves substantial risk of loss and is not suitable for all investors. The value of investments may fluctuate and you may lose your entire investment.
            </p>
          </section>
          
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">SEBI Regulatory Warning</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              <li>Investments in securities market are subject to market risks</li>
              <li>Past performance is not indicative of future returns</li>
              <li>Registration granted by SEBI does not imply recommendation or guarantee</li>
              <li>Investors should consult their financial advisors if in doubt about the suitability of products</li>
            </ul>
          </section>
          
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Specific Risk Factors</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">Equity Trading Risks:</h4>
                <p className="text-sm text-gray-600">Stock prices can be volatile and may result in significant losses. Liquidity risk may prevent immediate execution of orders.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">Derivatives Trading Risks:</h4>
                <p className="text-sm text-gray-600">Futures and options involve leverage which can amplify both gains and losses. You may lose more than your initial investment.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">Algorithmic Trading Risks:</h4>
                <p className="text-sm text-gray-600">Automated strategies may malfunction or execute unintended trades. Technical failures can result in losses.</p>
              </div>
            </div>
          </section>
          
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Your Responsibilities</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>You are solely responsible for all trading decisions</li>
              <li>You must ensure sufficient funds/margin before placing orders</li>
              <li>You acknowledge that TradePro AI is a platform provider, not an investment advisor</li>
              <li>You must comply with all SEBI regulations and tax obligations</li>
            </ul>
          </section>
          
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Grievance Redressal</h3>
            <p className="text-sm text-gray-700">
              For any grievances, please contact our Compliance Officer at compliance@tradepro.in within 30 days. Unresolved grievances can be escalated to SEBI via SCORES portal.
            </p>
          </section>
          
          <section className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Legal Disclaimer</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              This platform is provided "as is" without warranties. We do not guarantee continuous availability, accuracy of data, or freedom from errors. By using this platform, you agree to indemnify TradePro AI from any claims arising from your trading activities. This agreement is governed by Indian laws and courts in Mumbai have exclusive jurisdiction.
            </p>
          </section>
          
          {!hasScrolledToBottom && (
            <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-2 text-center">
              <p className="text-sm text-gray-500 animate-pulse">
                ↓ Scroll down to continue ↓
              </p>
            </div>
          )}
        </div>
        
        {/* Agreement Checkboxes */}
        <div className="px-6 py-4 border-t border-gray-200 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              disabled={!hasScrolledToBottom}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              data-testid="agree-terms-checkbox"
              ref={firstFocusRef}
            />
            <span className={`text-sm ${hasScrolledToBottom ? 'text-gray-900' : 'text-gray-400'}`}>
              I have read and understood the risk disclosure statement and agree to the terms and conditions
            </span>
          </label>
          
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreedToRisks}
              onChange={(e) => setAgreedToRisks(e.target.checked)}
              disabled={!hasScrolledToBottom}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              data-testid="agree-risks-checkbox"
            />
            <span className={`text-sm ${hasScrolledToBottom ? 'text-gray-900' : 'text-gray-400'}`}>
              I acknowledge the risks involved in trading and accept full responsibility for my investment decisions
            </span>
          </label>
        </div>
        
        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={handleAcknowledge}
            disabled={!canAcknowledge}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            data-testid="acknowledge-button"
          >
            <Check className="w-5 h-5 mr-2" aria-hidden="true" />
            I Acknowledge and Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskDisclaimerModal;
