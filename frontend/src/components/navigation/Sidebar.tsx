import React, { useMemo } from 'react';
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
import { useIncidentStore } from '../../stores/useIncidentStore';
import { cn } from '../../utils/cn';

export interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { isSidebarCollapsed, toggleSidebar, setCreateModalOpen } = useCommandStore();
  const { organization, user } = useAuthStore();
  const location = useLocation();
  const incidents = useIncidentStore((state) => state.incidents);

  // Real badge counts derived from actual incident data
  const incidentBadge = useMemo(() => {
    const open = incidents.filter((inc) => !['RESOLVED', 'CLOSED'].includes(inc.status)).length;
    return open > 0 ? (open > 99 ? '99+' : String(open)) : null;
  }, [incidents]);

  const alertBadge = useMemo(() => {
    const active = incidents.filter(
      (inc) =>
        ['CRITICAL', 'HIGH'].includes(inc.severity) && !['RESOLVED', 'CLOSED'].includes(inc.status)
    ).length;
    return active > 0 ? (active > 9 ? '9+' : String(active)) : null;
  }, [incidents]);

  const navItems = [
    { label: 'Overview', path: '/', icon: LayoutDashboard },
    { label: 'Incidents', path: '/incidents', icon: AlertTriangle, badge: incidentBadge },
    { label: 'AI Copilot', path: '/ai-assistant', icon: Bot, isAi: true },
    { label: 'Knowledge', path: '/knowledge', icon: BookOpen, isAi: true },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Timeline', path: '/timeline', icon: GitCommit },
    { label: 'Alerts', path: '/alerts', icon: Bell, badge: alertBadge, isAlert: true },
  ];

  const adminNavItems = [
    { label: 'Team', path: '/team', icon: Users },
    { label: 'Organizations', path: '/organizations', icon: Building2 },
    { label: 'Activity', path: '/activity-log', icon: Activity },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const renderNavGroup = (items: typeof navItems) =>
    items.map((item) => {
      const Icon = item.icon;
      const isActive =
        item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
      const badge = 'badge' in item ? item.badge : null;
      const isAlert = 'isAlert' in item ? item.isAlert : false;

      return (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => {
            if (window.innerWidth < 1024 && !isSidebarCollapsed) toggleSidebar();
          }}
          className={cn(
            'relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group outline-none',
            isActive
              ? 'bg-white/[0.07] text-white'
              : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]',
            item.isAi && !isActive && 'text-indigo-300/80 hover:text-indigo-200',
            isAlert && !isActive && badge && 'text-amber-400/80 hover:text-amber-300'
          )}
          aria-current={isActive ? 'page' : undefined}
        >
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-400 rounded-r-full"
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            />
          )}

          <Icon
            className={cn(
              'w-4 h-4 shrink-0',
              item.isAi
                ? 'text-indigo-300'
                : isActive
                  ? 'text-zinc-100'
                  : isAlert && badge
                    ? 'text-amber-400'
                    : 'text-zinc-500 group-hover:text-zinc-300'
            )}
          />

          {!isSidebarCollapsed && (
            <span className="truncate flex-1 flex items-center justify-between">
              <span>{item.label}</span>
              {badge && (
                <span
                  className={cn(
                    'ml-auto min-w-[18px] px-1 py-0.5 text-[9px] font-mono font-bold rounded text-center',
                    isAlert
                      ? 'text-amber-300 bg-amber-500/[0.12] border border-amber-500/20'
                      : 'text-zinc-400 bg-white/[0.05] border border-white/[0.08]'
                  )}
                >
                  {badge}
                </span>
              )}
            </span>
          )}

          {/* Collapsed badge dot */}
          {isSidebarCollapsed && badge && (
            <span
              className={cn(
                'absolute top-1 right-1 w-1.5 h-1.5 rounded-full',
                isAlert ? 'bg-amber-400 animate-critical-pulse' : 'bg-indigo-400'
              )}
            />
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
        animate={{ width: isSidebarCollapsed ? 68 : 244 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen flex flex-col z-50 lg:z-30 shrink-0 select-none overflow-hidden',
          'bg-[#08090d]/98 backdrop-blur-xl border-r border-white/[0.06]',
          isSidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0',
          className
        )}
      >
        {/* Brand Header */}
        <div className="h-14 px-3 flex items-center justify-between shrink-0 border-b border-white/[0.05]">
          <NavLink to="/" className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.1] bg-white/[0.05]">
              <img src={transactLogo} alt="OpsMind logo" className="h-5 w-5 object-contain" />
            </div>

            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col min-w-0 truncate"
              >
                <span className="font-semibold text-sm text-zinc-50 tracking-tight leading-tight">
                  OpsMind
                </span>
                <span className="text-[10px] text-zinc-500 truncate leading-tight">
                  {organization?.name || 'Security workspace'}
                </span>
              </motion.div>
            )}
          </NavLink>

          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors shrink-0"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <span className="flex items-center">
                <ChevronLeft className="w-3.5 h-3.5 hidden lg:inline" />
                <X className="w-3.5 h-3.5 lg:hidden" />
              </span>
            )}
          </button>
        </div>

        {/* New Incident Button */}
        <div className="px-2.5 pt-3 pb-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setCreateModalOpen(true);
              if (!isSidebarCollapsed && window.innerWidth < 1024) toggleSidebar();
            }}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-lg font-medium text-xs transition-all duration-150',
              isSidebarCollapsed
                ? 'p-2 bg-indigo-500 text-white hover:bg-indigo-400 shadow-glow-indigo'
                : 'py-2 px-3 bg-indigo-500/[0.12] hover:bg-indigo-500/[0.18] text-indigo-300 border border-indigo-500/20 hover:border-indigo-400/30'
            )}
            title="New Incident"
            aria-label="Create New Incident"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            {!isSidebarCollapsed && <span>New incident</span>}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-6">
          <div className="space-y-0.5">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[9px] font-semibold text-zinc-600 uppercase tracking-[0.2em] mb-1.5">
                Workspace
              </p>
            )}
            {renderNavGroup(navItems)}
          </div>

          <div className="space-y-0.5">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[9px] font-semibold text-zinc-600 uppercase tracking-[0.2em] mb-1.5">
                Manage
              </p>
            )}
            {renderNavGroup(adminNavItems)}
          </div>
        </div>

        {/* User Profile */}
        <div className="px-2.5 pb-3 pt-2 border-t border-white/[0.05] shrink-0">
          <NavLink
            to="/profile"
            onClick={() => {
              if (window.innerWidth < 1024 && !isSidebarCollapsed) toggleSidebar();
            }}
            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-7 h-7 rounded-full border border-white/[0.1] bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.full_name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-semibold text-zinc-300">
                  {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {!isSidebarCollapsed && (
              <div className="flex flex-col truncate min-w-0">
                <span className="text-xs font-medium text-zinc-200 truncate leading-tight">
                  {user?.full_name || 'Operator'}
                </span>
                <span className="text-[10px] text-zinc-600 truncate leading-tight font-mono">
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
