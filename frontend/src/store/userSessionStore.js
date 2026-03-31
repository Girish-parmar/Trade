/**
 * User Session Store (Zustand)
 * 
 * User authentication and session state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useUserSessionStore = create(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        kycStatus: 'pending',
        tradingEnabled: false,
        role: 'viewer',
        permissions: [],
        region: null,
        ipAddress: null,
        lastActivity: null,
        
        login: (userData, token) => set({
          user: userData,
          token,
          isAuthenticated: true,
          kycStatus: userData.kyc_status || 'pending',
          tradingEnabled: userData.trading_enabled || false,
          role: userData.role || 'viewer',
          permissions: userData.permissions || [],
          lastActivity: new Date().toISOString(),
        }),
        
        logout: () => set({
          user: null,
          token: null,
          isAuthenticated: false,
          kycStatus: 'pending',
          tradingEnabled: false,
          role: 'viewer',
          permissions: [],
        }),
        
        updateUser: (userData) => set((state) => ({
          user: { ...state.user, ...userData },
          lastActivity: new Date().toISOString(),
        })),
        
        updateKycStatus: (status) => set({
          kycStatus: status,
          lastActivity: new Date().toISOString(),
        }),
        
        enableTrading: () => set({
          tradingEnabled: true,
          lastActivity: new Date().toISOString(),
        }),
        
        updateActivity: () => set({
          lastActivity: new Date().toISOString(),
        }),
        
        hasPermission: (permission) => {
          const state = get();
          return state.permissions.includes(permission);
        },
        
        hasRole: (requiredRole) => {
          const state = get();
          const roleHierarchy = {
            admin: ['admin', 'compliance_officer', 'risk_manager', 'trader', 'viewer'],
            compliance_officer: ['compliance_officer', 'viewer'],
            risk_manager: ['risk_manager', 'viewer'],
            trader: ['trader', 'viewer'],
            viewer: ['viewer'],
          };
          return roleHierarchy[state.role]?.includes(requiredRole);
        },
        
        isKycApproved: () => get().kycStatus === 'approved',
        
        canTrade: () => {
          const state = get();
          return state.tradingEnabled && state.kycStatus === 'approved' && state.isAuthenticated;
        },
      }),
      {
        name: 'user-session-storage',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          kycStatus: state.kycStatus,
          tradingEnabled: state.tradingEnabled,
          role: state.role,
          permissions: state.permissions,
        }),
      }
    ),
    { name: 'UserSessionStore' }
  )
);

export default useUserSessionStore;
