import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/common/Avatar';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
        <Link to="/dashboard" className="text-lg font-bold text-indigo-600">
          Task Manager
        </Link>
        <div className="flex items-center gap-3">
          <NotificationBell />
          {user && (
            <div className="flex items-center gap-2">
              <Avatar user={user} />
              <span className="text-sm text-slate-700">{user.name}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
