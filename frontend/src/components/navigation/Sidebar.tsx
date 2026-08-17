import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import transactLogo from '../../assets/brand/transact-logo.svg';

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Building2,
  ChevronLeft,
  ChevronRight,
  GitCommit,
  LayoutDashboard,
  Plus,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useCommandStore } from '../../stores/useCommandStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { cn } from '../../utils/cn';

export interface SidebarProps {
  className?: string;
}

const navItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Incidents', path: '/incidents', icon: AlertTriangle, badge: '3' },
  { label: 'AI Copilot', path: '/ai-assistant', icon: Bot, isAi: true },
  { label: 'Knowledge', path: '/knowledge', icon: BookOpen, isAi: true },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Timeline', path: '/timeline', icon: GitCommit },
  { label: 'Alerts', path: '/alerts', icon: Bell, badge: '5' },
];

const adminNavItems = [
  { label: 'Team', path: '/team', icon: Users },
  { label: 'Organizations', path: '/organizations', icon: Building2 },
  { label: 'Activity', path: '/activity-log', icon: Activity },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { isSidebarCollapsed, toggleSidebar, setCreateModalOpen } = useCommandStore();
  const { organization, user } = useAuthStore();
  const location = useLocation();

  const renderNavGroup = (items: typeof navItems) =>
    items.map((item) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.path;

      return (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => {
            if (window.innerWidth < 1024 && !isSidebarCollapsed) toggleSidebar();
          }}
          className={cn(
            'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors group',
            isActive
              ? 'bg-white/[0.06] text-white'
              : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.035]',
            item.isAi && !isActive && 'text-indigo-300/80 hover:text-indigo-200'
          )}
        >
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-400 rounded-r-full"
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            />
          )}

          <Icon
            className={cn(
              'w-4 h-4 shrink-0',
              item.isAi ? 'text-indigo-300' : isActive ? 'text-zinc-100' : 'text-zinc-500'
            )}
          />

          {!isSidebarCollapsed && (
            <span className="truncate flex-1 flex items-center justify-between">
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto min-w-5 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-zinc-400 bg-white/[0.04] border border-white/[0.07] rounded-md text-center">
                  {item.badge}
                </span>
              )}
            </span>
          )}
        </NavLink>
      );
    });

  return (
    <>
      <AnimatePresence>
        {!isSidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        aria-label="Main Navigation"
        aria-expanded={!isSidebarCollapsed}
        animate={{ width: isSidebarCollapsed ? 72 : 248 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen bg-[#0c0c0f]/95 backdrop-blur-xl border-r border-white/[0.06] flex flex-col z-50 lg:z-30 shrink-0 select-none overflow-hidden',
          isSidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0',
          className
        )}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.06]">
          <NavLink to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.04]">
              <img src={transactLogo} alt="logo" className="h-6 w-6 object-contain" />
            </div>

            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col truncate"
              >
                <span className="font-semibold text-sm text-zinc-100 tracking-tight">OpsMind</span>
                <span className="text-[10px] text-zinc-500 truncate">
                  {organization?.name || 'Security workspace'}
                </span>
              </motion.div>
            )}
          </NavLink>

          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-100 hover:bg-white/[0.05] transition-colors"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <span className="flex items-center">
                <ChevronLeft className="w-4 h-4 hidden lg:inline" />
                <X className="w-4 h-4 lg:hidden" />
              </span>
            )}
          </button>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              setCreateModalOpen(true);
              if (!isSidebarCollapsed && window.innerWidth < 1024) toggleSidebar();
            }}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-lg font-medium text-xs transition-colors',
              isSidebarCollapsed
                ? 'p-2.5 bg-indigo-500 text-white hover:bg-indigo-400'
                : 'py-2.5 px-3 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-100 border border-white/[0.08]'
            )}
            title="New Incident"
            aria-label="Create New Incident"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>New incident</span>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-7">
          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[9px] font-semibold text-zinc-600 uppercase tracking-[0.2em] mb-2">
                Workspace
              </p>
            )}
            {renderNavGroup(navItems)}
          </div>

          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[9px] font-semibold text-zinc-600 uppercase tracking-[0.2em] mb-2">
                Manage
              </p>
            )}
            {renderNavGroup(adminNavItems)}
          </div>
        </div>

        <div className="p-3 border-t border-white/[0.06]">
          <NavLink
            to="/profile"
            onClick={() => {
              if (window.innerWidth < 1024 && !isSidebarCollapsed) toggleSidebar();
            }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-white/[0.08] bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={user?.full_name || 'User'}
                className="w-full h-full object-cover"
              />
            </div>

            {!isSidebarCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-medium text-zinc-200 truncate">
                  {user?.full_name || 'Operator'}
                </span>
                <span className="text-[10px] text-zinc-500 truncate">
                  {user?.role || 'Responder'}
                </span>
              </div>
            )}
          </NavLink>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
