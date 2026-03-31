/**
 * TradePro AI V3.0 - Main Application
 * 
 * Root component with routing and layout structure
 */

import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

// Layouts
import RootLayout from "@/layouts/RootLayout";
import DashboardLayout from "@/layouts/DashboardLayout";

// Pages
import TradingDashboard from "@/pages/TradingDashboard";

// Stores
import useUserSessionStore from "@/store/userSessionStore";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Landing Page (Public)
 */
const LandingPage = () => {
  const { isAuthenticated } = useUserSessionStore();
  
  const testBackendConnection = async () => {
    try {
      const response = await axios.get(`${API}/`);
      console.log('[Backend] Connection successful:', response.data.message);
    } catch (e) {
      console.error('[Backend] Connection error:', e);
    }
  };

  useEffect(() => {
    testBackendConnection();
  }, []);

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-blue-200 to-blue-400 bg-clip-text text-transparent">
            TradePro AI
          </h1>
          <p className="text-2xl text-blue-200">
            Enterprise Algorithmic Trading Platform
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-6">
            Welcome to the Future of Trading
          </h2>
          
          <ul className="text-left space-y-3 mb-8 text-blue-100">
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              SEBI/RBI Compliant Platform
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Real-time Market Data & Analytics
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Advanced Algo Trading (TWAP, VWAP, Iceberg)
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              AI-Powered Trading Insights
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Hardware Security Module (HSM) Protected
            </li>
          </ul>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                // Mock login for demo - Replace with actual auth
                useUserSessionStore.getState().login({
                  id: 'demo-user',
                  email: 'demo@tradepro.ai',
                  full_name: 'Demo Trader',
                  role: 'trader',
                  kyc_status: 'approved',
                  trading_enabled: true,
                  permissions: ['orders.place', 'orders.view'],
                }, 'demo-token-12345');
              }}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-lg"
              data-testid="demo-login-button"
            >
              Demo Login (Trader)
            </button>
            
            <button
              onClick={() => {
                useUserSessionStore.getState().login({
                  id: 'demo-viewer',
                  email: 'viewer@tradepro.ai',
                  full_name: 'Demo Viewer',
                  role: 'viewer',
                  kyc_status: 'pending',
                  trading_enabled: false,
                  permissions: [],
                }, 'demo-token-viewer');
              }}
              className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors shadow-lg"
            >
              Demo Login (Viewer)
            </button>
          </div>
          
          <p className="mt-6 text-sm text-blue-200">
            Phase 2: Core Frontend Architecture Complete
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Protected Route Wrapper
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useUserSessionStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

/**
 * Main App Component
 */
function App() {
  return (
    <BrowserRouter>
      <RootLayout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TradingDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RootLayout>
    </BrowserRouter>
  );
}

export default App;
