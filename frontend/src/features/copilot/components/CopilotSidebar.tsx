import React, { useState, useRef, useEffect } from 'react';
import { CopilotSession, CopilotFilter } from '../types';
import {
  Search,
  Pin,
  Archive,
  Trash2,
  Edit2,
  Check,
  X,
  MessageSquare,
  Clock,
  Plus,
} from 'lucide-react';

export interface CopilotSidebarProps {
  sessions: CopilotSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  searchQuery: string;
  filter: CopilotFilter;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onRenameSession: (sessionId: string, title: string) => Promise<void> | void;
  onTogglePinSession: (sessionId: string) => Promise<void> | void;
  onArchiveSession: (sessionId: string, isArchived?: boolean) => Promise<void> | void;
  onDeleteSession: (sessionId: string) => Promise<void> | void;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: CopilotFilter) => void;
}

export const CopilotSidebar: React.FC<CopilotSidebarProps> = React.memo(
  ({
    sessions,
    activeSessionId,
    isLoading,
    searchQuery,
    filter,
    onSelectSession,
    onCreateSession,
    onRenameSession,
    onTogglePinSession,
    onArchiveSession,
    onDeleteSession,
    onSearchChange,
    onFilterChange,
  }) => {
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(0);
    const listRef = useRef<HTMLDivElement | null>(null);

    const startRename = (e: React.MouseEvent, session: CopilotSession) => {
      e.stopPropagation();
      setEditingSessionId(session.id);
      setEditingTitle(session.title);
    };

    const submitRename = async (sessionId: string) => {
      if (editingTitle.trim()) {
        await onRenameSession(sessionId, editingTitle.trim());
      }
      setEditingSessionId(null);
    };

    const formatLastUpdated = (iso?: string) => {
      if (!iso) return '';
      try {
        const date = new Date(iso);
        const now = new Date();
        const diffHrs = Math.round((now.getTime() - date.getTime()) / 3600000);
        if (diffHrs < 1) return 'Just now';
        if (diffHrs < 24) return `${diffHrs}h ago`;
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } catch {
        return '';
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (sessions.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, sessions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const target = sessions[focusedIndex];
        if (target) onSelectSession(target.id);
      }
    };

    useEffect(() => {
      const activeIdx = sessions.findIndex((s) => s.id === activeSessionId);
      if (activeIdx !== -1) setFocusedIndex(activeIdx);
    }, [activeSessionId, sessions]);

    return (
      <aside
        className="flex h-full w-full shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950 md:w-72"
        aria-label="Enterprise AI Copilot Sidebar"
      >
        <div className="border-b border-zinc-800/80 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                Investigations
              </p>
              <p className="mt-1 text-xs text-zinc-400">Conversation history</p>
            </div>
            <button
              onClick={onCreateSession}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
              aria-label="Create new conversation (Ctrl+N)"
              title="Create new conversation (Ctrl+N)"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search investigations"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900/70 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-700"
              aria-label="Search investigations"
            />
          </div>

          <div className="mt-2 flex items-center gap-1 border-b border-zinc-800/70">
            {(['all', 'pinned', 'archived'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => onFilterChange(tab)}
                className={`border-b-2 px-2.5 py-1.5 text-[11px] capitalize transition-colors ${
                  filter === tab
                    ? 'border-zinc-100 text-zinc-100'
                    : 'border-transparent text-zinc-600 hover:text-zinc-300'
                }`}
                aria-label={`Filter sessions by ${tab}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={listRef}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className="flex-1 space-y-0.5 overflow-y-auto p-2 focus:outline-none"
          role="listbox"
          aria-label="Conversation Sessions List"
        >
          {isLoading ? (
            <div className="space-y-2 p-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-md bg-zinc-900/60" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center px-4 text-center text-zinc-600">
              <MessageSquare className="mb-2 h-7 w-7 text-zinc-800" />
              <p className="text-xs font-semibold text-zinc-400">No conversations found</p>
              <p className="mt-1 text-[11px] leading-5">
                {searchQuery
                  ? 'No sessions match your search filter.'
                  : 'Start a new investigation to begin analysis.'}
              </p>
            </div>
          ) : (
            sessions.map((session, index) => {
              const isActive = session.id === activeSessionId;
              const isFocused = index === focusedIndex;
              const isEditing = session.id === editingSessionId;

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  role="option"
                  aria-selected={isActive}
                  className={`group relative flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2 transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-zinc-100'
                      : isFocused
                        ? 'bg-zinc-900/60 text-zinc-200'
                        : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitRename(session.id);
                            if (e.key === 'Escape') setEditingSessionId(null);
                          }}
                          autoFocus
                          className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 focus:outline-none"
                        />
                        <button
                          onClick={() => submitRename(session.id)}
                          className="rounded p-1 text-emerald-400 hover:bg-zinc-800"
                          aria-label="Confirm rename"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingSessionId(null)}
                          className="rounded p-1 text-zinc-500 hover:bg-zinc-800"
                          aria-label="Cancel rename"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {session.is_pinned && (
                          <Pin className="h-3 w-3 shrink-0 fill-zinc-500 text-zinc-500" />
                        )}
                        <span className="block truncate text-xs font-medium">
                          {session.title || 'Untitled Investigation'}
                        </span>
                        {session.unread_count ? (
                          <span className="min-w-4 rounded bg-zinc-100 px-1 text-center text-[9px] font-bold text-zinc-900">
                            {session.unread_count}
                          </span>
                        ) : null}
                      </div>
                    )}

                    <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-zinc-600">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatLastUpdated(session.updated_at || session.created_at)}
                      </span>
                      {session.model && <span>• {session.model}</span>}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePinSession(session.id);
                        }}
                        className="rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                        title={session.is_pinned ? 'Unpin' : 'Pin'}
                        aria-label={session.is_pinned ? 'Unpin conversation' : 'Pin conversation'}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => startRename(e, session)}
                        className="rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                        title="Rename"
                        aria-label="Rename conversation"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchiveSession(session.id, !session.is_archived);
                        }}
                        className="rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                        title={session.is_archived ? 'Unarchive' : 'Archive'}
                        aria-label={
                          session.is_archived ? 'Unarchive conversation' : 'Archive conversation'
                        }
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this conversation session?')) {
                            onDeleteSession(session.id);
                          }
                        }}
                        className="rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-rose-400"
                        title="Delete"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    );
  }
);

CopilotSidebar.displayName = 'CopilotSidebar';
