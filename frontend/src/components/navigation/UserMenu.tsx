import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Settings, LogOut, Activity, ChevronDown, Building2 } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { RoleBadge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

export interface UserMenuProps {
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ className }) => {
  const { user, organization, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    toast.success('Signed out from SOC platform successfully');
    navigate('/login');
  };

  return (
    <div className={cn('relative inline-block text-left', className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User account menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        <img
          src={
            user?.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          }
          alt={user?.full_name || 'Operator'}
          className="w-7 h-7 rounded-full border border-zinc-700 object-cover shrink-0"
        />
        {user?.role && <RoleBadge role={user.role} className="hidden sm:inline-flex" />}
        <ChevronDown
          className={cn('w-3 h-3 text-zinc-400 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-64 bg-surface-elevated border border-subtle rounded-xl shadow-2xl py-2 z-50 text-zinc-100"
          >
            {/* User Details Header */}
            <div className="px-4 py-3 border-b border-subtle">
              <p className="text-sm font-semibold truncate">{user?.full_name || 'Operator'}</p>
              <p className="text-xs text-zinc-400 font-mono truncate">{user?.email}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-subtle">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 truncate">
                  <Building2 className="w-3 h-3 text-zinc-500 shrink-0" />
                  <span className="truncate">{organization?.name || 'SOC Command'}</span>
                </span>
                {user?.role && <RoleBadge role={user.role} />}
              </div>
            </div>

            {/* Menu Links */}
            <div className="py-1" role="menu">
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                role="menuitem"
              >
                <UserIcon className="w-3.5 h-3.5 text-zinc-400" /> My Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                role="menuitem"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" /> Organization Settings
              </Link>
              <Link
                to="/activity-log"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                role="menuitem"
              >
                <Activity className="w-3.5 h-3.5 text-zinc-400" /> Activity Log
              </Link>
            </div>

            {/* Logout Footer */}
            <div className="pt-1 border-t border-subtle">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-950/40 transition-colors"
                role="menuitem"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
