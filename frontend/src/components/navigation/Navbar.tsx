import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Search, Command, Bell, Keyboard, ChevronRight, LogOut, User as UserIcon, Shield, Sparkles } from 'lucide-react';
import { useCommandStore } from '../../store/useCommandStore';
import { useAuthStore } from '../../store/useAuthStore';
import { RoleBadge } from '../ui/Badge';

export const Navbar: React.FC = () => {
  const { setCommandOpen, setShortcutsOpen } = useCommandStore();
  const { user, organization, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Generate breadcrumb path items
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = [
    { label: 'Platform', path: '/' },
    ...pathSegments.map((segment, index) => {
      const url = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      return { label, path: url };
    }),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 h-14 bg-surface/90 backdrop-blur-md border-b border-subtle flex items-center justify-between px-6 z-20 shrink-0">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-zinc-400">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.path}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />}
            {idx === breadcrumbs.length - 1 ? (
              <span className="text-zinc-100 font-semibold">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-zinc-200 transition-colors">
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Real-time System Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/40 border border-red-800/40 text-red-400 text-xs font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-red-500 critical-pulse" />
          <span>1 Critical Incident Active</span>
        </div>

        {/* Command Search Trigger */}
        <button
          onClick={() => setCommandOpen(true)}
          className="flex items-center gap-3 bg-surface-elevated hover:bg-surface-hover text-zinc-400 hover:text-zinc-200 border border-subtle rounded-lg px-3 py-1.5 text-xs transition-all shadow-sm group"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
          <span className="hidden md:inline">Search platform...</span>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>

        {/* AI Copilot Quick Launcher */}
        <Link
          to="/ai-assistant"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 hover:text-indigo-200 text-xs font-medium transition-all shadow-sm hover:shadow-indigo-500/10"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden lg:inline">AI Copilot</span>
        </Link>

        {/* Keyboard Shortcuts Trigger */}
        <button
          onClick={() => setShortcutsOpen(true)}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Notifications Icon */}
        <Link
          to="/alerts"
          className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
        </Link>

        <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

        {/* User Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.full_name || 'User'}
              className="w-7 h-7 rounded-full border border-zinc-700 object-cover"
            />
            {user?.role && <RoleBadge role={user.role} className="hidden sm:inline-flex" />}
          </button>

          {showUserDropdown && (
            <div
              className="absolute right-0 mt-2 w-64 bg-surface border border-zinc-800 rounded-xl shadow-2xl py-2 z-50 text-zinc-100"
              onClick={() => setShowUserDropdown(false)}
            >
              <div className="px-4 py-3 border-b border-zinc-800/80">
                <p className="text-sm font-semibold">{user?.full_name}</p>
                <p className="text-xs text-zinc-400 font-mono truncate">{user?.email}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60">
                  <span className="text-[11px] text-zinc-400">{organization?.name}</span>
                  {user?.role && <RoleBadge role={user.role} />}
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-zinc-400" /> My Profile
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-zinc-400" /> Organization Settings
                </Link>
              </div>

              <div className="pt-1 border-t border-zinc-800/80">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
