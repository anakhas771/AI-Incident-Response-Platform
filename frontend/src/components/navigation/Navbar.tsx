import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Keyboard, Menu, Sparkles } from 'lucide-react';
import { useCommandStore } from '../../stores/useCommandStore';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

export const Navbar: React.FC = () => {
  const { setShortcutsOpen, toggleSidebar } = useCommandStore();

  return (
    <header className="sticky top-0 h-16 bg-surface/95 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20 shrink-0">
      <div className="flex items-center gap-3 flex-1 min-w-0 max-w-2xl">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-white/[0.05] transition-colors lg:hidden"
          title="Open menu"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-full max-w-xl">
          <SearchBar />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 ml-4">
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/[0.05] text-emerald-300 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Systems operational</span>
        </div>

        <Link
          to="/ai-assistant"
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-colors text-xs font-medium"
          title="Open AI Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
          <span>Copilot</span>
        </Link>

        <button
          type="button"
          onClick={() => setShortcutsOpen(true)}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-white/[0.05] transition-colors"
          title="Keyboard shortcuts"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        <Link
          to="/alerts"
          className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-white/[0.05] transition-colors"
          title="Alerts queue"
          aria-label="Alerts queue"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
        </Link>

        <ThemeToggle />

        <div className="h-5 w-px bg-white/[0.08] mx-1" />

        <UserMenu />
      </div>
    </header>
  );
};

export default Navbar;
