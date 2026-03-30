import React from 'react';
import { Menu, Bell } from '@phosphor-icons/react';
import useAuthStore from '../../stores/authStore';

const Header = ({ onMenuClick }) => {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 bg-white border-b-2 border-border" data-testid="header">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Menu Button (Mobile) */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-secondary transition-base"
            data-testid="menu-button"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="hidden lg:block">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Welcome back, <span className="text-foreground font-semibold">{user?.name}</span>
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-4">
          <button 
            className="relative p-2 hover:bg-secondary transition-base"
            data-testid="notifications-button"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>
          
          <div className="hidden sm:flex items-center space-x-2 px-3 py-2 border border-border">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-xs font-mono uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;