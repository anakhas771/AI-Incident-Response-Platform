import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  AlertTriangle,
  Bot,
  BarChart3,
  GitCommit,
  Bell,
  Users,
  Building2,
  Settings,
  Activity,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  BookOpen,
  X,
} from 'lucide-react';
import { useCommandStore } from '../../stores/useCommandStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { cn } from '../../utils/cn';

export interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { isSidebarCollapsed, toggleSidebar, setCreateModalOpen } = useCommandStore();
  const { organization, user } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Incidents', path: '/incidents', icon: AlertTriangle, badge: '3' },
    { label: 'AI Copilot', path: '/ai-assistant', icon: Bot, isAi: true },
    { label: 'Knowledge Base', path: '/knowledge', icon: BookOpen, isAi: true },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Timeline', path: '/timeline', icon: GitCommit },
    { label: 'Alerts Queue', path: '/alerts', icon: Bell, badge: '5' },
  ];

  const adminNavItems = [
    { label: 'Team Members', path: '/team', icon: Users },
    { label: 'Organizations', path: '/organizations', icon: Building2 },
    { label: 'Activity Log', path: '/activity-log', icon: Activity },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {!isSidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Main Responsive Sidebar */}
      <motion.aside
        aria-label="Main Navigation"
        aria-expanded={!isSidebarCollapsed}
        animate={{
          width: isSidebarCollapsed ? 68 : 256,
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen bg-surface border-r border-subtle flex flex-col z-50 lg:z-30 shrink-0 select-none overflow-hidden transition-transform',
          isSidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0',
          className
        )}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-subtle">
          <NavLink to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col truncate"
              >
                <span className="font-bold text-sm text-zinc-100 tracking-tight flex items-center gap-1.5">
                  ANTIGRAVITY{' '}
                  <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800/60 px-1 rounded font-mono">
                    SOC
                  </span>
                </span>
                <span className="text-[11px] text-zinc-400 truncate">
                  {organization?.name || 'Cyber Platform'}
                </span>
              </motion.div>
            )}
          </NavLink>
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title={isSidebarCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
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

        {/* New Incident CTA */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              setCreateModalOpen(true);
              if (!isSidebarCollapsed && window.innerWidth < 1024) toggleSidebar();
            }}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-lg font-medium text-xs transition-all shadow-sm',
              isSidebarCollapsed
                ? 'p-2 bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'py-2 px-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-red-900/30'
            )}
            title="New Incident (C)"
            aria-label="Create New Incident"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>New Incident</span>}
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-6">
          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Platform Core
              </p>
            )}
            {navItems.map((item) => {
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
                    'relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
                    item.isAi && !isActive && 'text-indigo-400 hover:text-indigo-300'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-500 rounded-r"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                      item.isAi ? 'text-indigo-400' : isActive ? 'text-zinc-100' : 'text-zinc-400'
                    )}
                  />
                  {!isSidebarCollapsed && (
                    <span className="truncate flex-1 flex items-center justify-between">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-300">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Administration
              </p>
            )}
            {adminNavItems.map((item) => {
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
                    'relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-500 rounded-r"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={cn('w-4 h-4 shrink-0', isActive ? 'text-zinc-100' : 'text-zinc-400')}
                  />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-subtle bg-surface-elevated/30">
          <NavLink
            to="/profile"
            onClick={() => {
              if (window.innerWidth < 1024 && !isSidebarCollapsed) toggleSidebar();
            }}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <img
              src={
                user?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={user?.full_name || 'User'}
              className="w-7 h-7 rounded-full border border-zinc-700 object-cover shrink-0"
            />
            {!isSidebarCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-medium text-zinc-200 truncate">
                  {user?.full_name || 'Operator'}
                </span>
                <span className="text-[10px] text-indigo-400 font-mono">
                  {user?.role || 'RESPONDER'}
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
