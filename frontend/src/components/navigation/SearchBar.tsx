import React from 'react';
import { Search, Command } from 'lucide-react';
import { useCommandStore } from '../../stores/useCommandStore';
import { cn } from '../../utils/cn';

export interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  className,
  placeholder = 'Search SOC platform...',
}) => {
  const { setCommandOpen } = useCommandStore();

  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  return (
    <div role="search" className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        aria-label="Search platform"
        aria-keyshortcuts="Control+k Meta+k"
        className="w-full flex items-center justify-between gap-3 bg-surface-elevated hover:bg-surface-hover text-zinc-400 hover:text-zinc-200 border border-subtle hover:border-zinc-700 rounded-lg px-3 py-1.5 text-xs transition-all shadow-sm group"
      >
        <span className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-400 transition-colors shrink-0" />
          <span className="truncate">{placeholder}</span>
        </span>
        <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
          {isMac ? (
            <>
              <Command className="w-2.5 h-2.5" /> <span>K</span>
            </>
          ) : (
            <span>Ctrl K</span>
          )}
        </kbd>
      </button>
    </div>
  );
};

export default SearchBar;
