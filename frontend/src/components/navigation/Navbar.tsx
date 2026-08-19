import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Keyboard, Menu, Sparkles, Radio } from 'lucide-react';
import { useCommandStore } from '../../stores/useCommandStore';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { useIncidentStore } from '../../stores/useIncidentStore';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar: React.FC = () => {
  const { setShortcutsOpen, toggleSidebar } = useCommandStore();
  const incidents = useIncidentStore((state) => state.incidents);
  const loadIncidents = useIncidentStore((state) => state.loadIncidents);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  const activeAlertCount = useMemo(
    () =>
      incidents.filter(
        (incident) =>
          (incident.severity === 'CRITICAL' || incident.severity === 'HIGH') &&
          !['RESOLVED', 'CLOSED'].includes(incident.status)
      ).length,
    [incidents]
  );

  const hasCritical = useMemo(
    () =>
      incidents.some(
        (inc) => inc.severity === 'CRITICAL' && !['RESOLVED', 'CLOSED'].includes(inc.status)
      ),
    [incidents]
  );

  return (
    <header
      className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#07080c]/95 px-4 backdrop-blur-xl sm:px-6"
      role="banner"
    >
      {/* Left: mobile menu + search */}
      <div className="flex min-w-0 max-w-xl flex-1 items-center gap-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-100 lg:hidden"
          title="Open menu"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <div className="w-full max-w-md">
          <SearchBar />
        </div>
      </div>

      {/* Right: status + actions */}
      <div className="ml-3 flex shrink-0 items-center gap-1">
        {/* Systems status */}
        <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-2.5 py-1 text-[10px] font-medium text-emerald-400 xl:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-live-blink" />
          <span>Systems operational</span>
        </div>

        {/* Copilot shortcut */}
        <Link
          to="/ai-assistant"
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:bg-white/[0.05] hover:text-white sm:flex"
          title="Open AI Copilot"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Copilot</span>
        </Link>

        {/* Keyboard shortcuts */}
        <button
          type="button"
          onClick={() => setShortcutsOpen(true)}
          className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-white/[0.05] hover:text-zinc-300"
          title="Keyboard shortcuts"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </button>

        {/* Alerts bell */}
        <Link
          to="/alerts"
          className="relative rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-white/[0.05] hover:text-zinc-200"
          title={
            activeAlertCount
              ? `${activeAlertCount} active alert${activeAlertCount === 1 ? '' : 's'}`
              : 'Alerts queue'
          }
          aria-label={activeAlertCount ? `${activeAlertCount} active alerts` : 'Alerts queue'}
        >
          {hasCritical ? (
            <Radio className="h-4 w-4 text-red-400" />
          ) : (
            <Bell className="h-4 w-4" />
          )}

          <AnimatePresence>
            {activeAlertCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-0.5 -top-0.5 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white shadow-critical"
              >
                {activeAlertCount > 9 ? '9+' : activeAlertCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <ThemeToggle />

        <div className="mx-1 h-4 w-px bg-white/[0.07]" />

        <UserMenu />
      </div>
    </header>
  );
};

export default Navbar;
