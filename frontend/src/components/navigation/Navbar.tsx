import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Keyboard, Menu, Sparkles } from 'lucide-react';
import { useCommandStore } from '../../stores/useCommandStore';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { useIncidentStore } from '../../stores/useIncidentStore';

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

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-surface/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 max-w-2xl flex-1 items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-100 lg:hidden"
          title="Open menu"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="w-full max-w-xl">
          <SearchBar />
        </div>
      </div>

      <div className="ml-4 flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.05] px-3 py-1.5 text-[11px] font-medium text-emerald-300 xl:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Systems operational</span>
        </div>

        <Link
          to="/ai-assistant"
          className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white sm:flex"
          title="Open AI Copilot"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
          <span>Copilot</span>
        </Link>

        <button
          type="button"
          onClick={() => setShortcutsOpen(true)}
          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-100"
          title="Keyboard shortcuts"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </button>

        <Link
          to="/alerts"
          className="relative rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-100"
          title={activeAlertCount ? `${activeAlertCount} active alert${activeAlertCount === 1 ? '' : 's'}` : 'Alerts queue'}
          aria-label={activeAlertCount ? `${activeAlertCount} active alerts` : 'Alerts queue'}
        >
          <Bell className="h-4 w-4" />
          {activeAlertCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
              {activeAlertCount > 9 ? '9+' : activeAlertCount}
            </span>
          )}
        </Link>

        <ThemeToggle />

        <div className="mx-1 h-5 w-px bg-white/[0.08]" />

        <UserMenu />
      </div>
    </header>
  );
};

export default Navbar;
