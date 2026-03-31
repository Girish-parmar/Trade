/**
 * Compliance Store (Zustand)
 * 
 * SEBI/RBI compliance acknowledgments and warnings
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useComplianceStore = create(
  devtools(
    persist(
      (set, get) => ({
        riskDisclaimerAcknowledged: false,
        riskDisclaimerAcknowledgedAt: null,
        preTradeChecklistCompleted: false,
        sebiWarningMinimized: false,
        complianceFlags: [],
        fatFingerWarningsAcknowledged: {},
        circuitBreakerAlerts: [],
        
        acknowledgeRiskDisclaimer: () => set({
          riskDisclaimerAcknowledged: true,
          riskDisclaimerAcknowledgedAt: new Date().toISOString(),
        }),
        
        completePreTradeChecklist: () => set({
          preTradeChecklistCompleted: true,
        }),
        
        minimizeSebiWarning: () => set({
          sebiWarningMinimized: true,
        }),
        
        expandSebiWarning: () => set({
          sebiWarningMinimized: false,
        }),
        
        addComplianceFlag: (flag) => set((state) => ({
          complianceFlags: [...state.complianceFlags, flag],
        })),
        
        removeComplianceFlag: (flagId) => set((state) => ({
          complianceFlags: state.complianceFlags.filter(f => f.id !== flagId),
        })),
        
        acknowledgeFatFingerWarning: (orderId) => set((state) => ({
          fatFingerWarningsAcknowledged: {
            ...state.fatFingerWarningsAcknowledged,
            [orderId]: true,
          },
        })),
        
        addCircuitBreakerAlert: (alert) => set((state) => ({
          circuitBreakerAlerts: [alert, ...state.circuitBreakerAlerts].slice(0, 10),
        })),
        
        clearCircuitBreakerAlerts: () => set({
          circuitBreakerAlerts: [],
        }),
        
        resetSessionCompliance: () => set({
          preTradeChecklistCompleted: false,
          sebiWarningMinimized: false,
          fatFingerWarningsAcknowledged: {},
        }),
        
        canPlaceOrder: () => {
          const state = get();
          return state.riskDisclaimerAcknowledged && state.preTradeChecklistCompleted;
        },
        
        hasCriticalFlags: () => {
          const state = get();
          return state.complianceFlags.some(f => f.severity === 'critical');
        },
        
        getFatFingerWarning: (orderId) => {
          const state = get();
          return state.fatFingerWarningsAcknowledged[orderId];
        },
      }),
      {
        name: 'compliance-storage',
        partialize: (state) => ({
          riskDisclaimerAcknowledged: state.riskDisclaimerAcknowledged,
          riskDisclaimerAcknowledgedAt: state.riskDisclaimerAcknowledgedAt,
        }),
      }
    ),
    { name: 'ComplianceStore' }
  )
);

export default useComplianceStore;
