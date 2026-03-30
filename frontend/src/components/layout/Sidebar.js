import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { 
  House, 
  ChartLine, 
  FlowArrow, 
  ShoppingCart, 
  Crosshair, 
  ChartBar, 
  FolderOpen, 
  Gear, 
  SignOut,
  List
} from '@phosphor-icons/react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: House, label: 'Dashboard' },
    { path: '/terminal', icon: ChartLine, label: 'Trading Terminal' },
    { path: '/strategies', icon: FlowArrow, label: 'Strategies' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/positions', icon: List, label: 'Positions' },
    { path: '/screener', icon: Crosshair, label: 'Screener' },
    { path: '/analytics', icon: ChartBar, label: 'Analytics' },
    { path: '/portfolio', icon: FolderOpen, label: 'Portfolio' },
    { path: '/settings', icon: Gear, label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full bg-white border-r-2 border-border z-50
          w-64 transform transition-transform duration-200 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
        `}
        data-testid="sidebar"
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b-2 border-border">
            <h1 className="text-xl font-heading font-bold tracking-tighter">TRADEPRO AI</h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-1">Enterprise Platform</p>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center font-mono text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-semibold truncate">{user?.name}</p>
                <p className="text-xs font-mono text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose()}
                    className={`
                      flex items-center space-x-3 px-4 py-3 font-mono text-sm
                      border-2 transition-base
                      ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white text-foreground border-transparent hover:border-border'
                      }
                    `}
                    data-testid={`nav-${item.path.slice(1)}`}
                  >
                    <Icon className="h-5 w-5" weight={isActive ? 'fill' : 'regular'} />
                    <span className="font-semibold uppercase tracking-wider text-xs">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t-2 border-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 font-mono text-sm bg-white text-foreground border-2 border-border hover:border-destructive hover:text-destructive transition-base"
              data-testid="logout-button"
            >
              <SignOut className="h-5 w-5" />
              <span className="font-semibold uppercase tracking-wider text-xs">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;