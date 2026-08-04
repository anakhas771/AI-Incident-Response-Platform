import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Keyboard, Sparkles, Menu } from 'lucide-react';
import { useCommandStore } from '../../stores/useCommandStore';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

export const Navbar: React.FC = () => {
  const { setShortcutsOpen, toggleSidebar } = useCommandStore();

  return (
    <header className="sticky top-0 h-14 bg-surface/90 backdrop-blur-md border-b border-subtle flex items-center justify-between px-4 sm:px-6 z-20 shrink-0">
      {/* Left: Mobile Menu Button & SearchBar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors lg:hidden"
          title="Open Menu (⌘B)"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-full">
          <SearchBar />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-time System Status Indicator */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/40 border border-red-800/40 text-red-400 text-xs font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-red-500 critical-pulse" />
          <span>1 Critical Incident Active</span>
        </div>

        {/* AI Copilot Quick Launcher */}
        <Link
          to="/ai-assistant"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 hover:text-indigo-200 text-xs font-medium transition-all shadow-sm hover:shadow-indigo-500/10"
          title="Open AI Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">AI Copilot</span>
        </Link>

        {/* Keyboard Shortcuts Trigger */}
        <button
          type="button"
          onClick={() => setShortcutsOpen(true)}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Notifications Icon */}
        <Link
          to="/alerts"
          className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="Alerts Queue"
          aria-label="Alerts queue"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
        </Link>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        <div className="h-4 w-[1px] bg-zinc-800 mx-0.5 sm:mx-1" />

        {/* User Menu Dropdown */}
        <UserMenu />
      </div>
    </header>
  );
};

export default Navbar;
