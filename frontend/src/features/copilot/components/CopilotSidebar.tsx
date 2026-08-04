import React, { useState, useRef, useEffect } from 'react';
import { CopilotSession, CopilotFilter } from '../types';
import {
  MessageSquarePlus,
  Search,
  Pin,
  Archive,
  Trash2,
  Edit2,
  Check,
  X,
  MessageSquare,
  Clock,
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

/**
 * Enterprise Conversation Sidebar with keyboard navigation, search, filters, unread badges, and inline actions.
 */
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

    // Keyboard navigation (ArrowUp, ArrowDown, Enter)
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
        if (target) {
          onSelectSession(target.id);
        }
      }
    };

    useEffect(() => {
      const activeIdx = sessions.findIndex((s) => s.id === activeSessionId);
      if (activeIdx !== -1) {
        setFocusedIndex(activeIdx);
      }
    }, [activeSessionId, sessions]);

    return (
      <aside
        className="w-full md:w-72 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0"
        aria-label="Enterprise AI Copilot Sidebar"
      >
        {/* Header Action: New Investigation Button */}
        <div className="p-3 border-b border-zinc-800/80">
          <button
            onClick={onCreateSession}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20"
            aria-label="Create new conversation (Ctrl+N)"
            title="Create new conversation (Ctrl+N)"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>New Investigation</span>
          </button>

          {/* Search Input */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search investigations... (Ctrl+K)"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              aria-label="Search investigations"
            />
          </div>

          {/* Filter Tabs */}
          <div className="grid grid-cols-3 gap-1 mt-2 p-1 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-[11px] font-medium text-center">
            {(['all', 'pinned', 'archived'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => onFilterChange(tab)}
                className={`py-1 rounded capitalize transition-all ${
                  filter === tab
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                aria-label={`Filter sessions by ${tab}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        <div
          ref={listRef}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className="flex-1 overflow-y-auto p-2 space-y-1 focus:outline-none"
          role="listbox"
          aria-label="Conversation Sessions List"
        >
          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-zinc-900/60 animate-pulse border border-zinc-800/60"
                />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-48 text-center px-4 text-zinc-500">
              <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
              <p className="text-xs font-semibold text-zinc-400">No conversations found</p>
              <p className="text-[11px] mt-1">
                {searchQuery
                  ? 'No sessions match your search filter.'
                  : 'Start a new investigation to begin analysis.'}
              </p>
            </div>
          ) : (
            /* Session Items */
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
                  className={`group relative flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-white'
                      : isFocused
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                        : 'bg-transparent border-transparent hover:bg-zinc-900/60 hover:border-zinc-800 text-zinc-300'
                  }`}
                >
                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0 pr-2">
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
                          className="w-full px-2 py-0.5 rounded bg-zinc-950 border border-indigo-500 text-xs text-zinc-100 focus:outline-none"
                        />
                        <button
                          onClick={() => submitRename(session.id)}
                          className="p-1 rounded text-emerald-400 hover:bg-zinc-800"
                          aria-label="Confirm rename"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingSessionId(null)}
                          className="p-1 rounded text-zinc-400 hover:bg-zinc-800"
                          aria-label="Cancel rename"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {session.is_pinned && (
                          <Pin className="w-3 h-3 text-indigo-400 shrink-0 fill-indigo-400" />
                        )}
                        <span className="text-xs font-semibold truncate block">
                          {session.title || 'Untitled Investigation'}
                        </span>
                        {session.unread_count ? (
                          <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                            {session.unread_count}
                          </span>
                        ) : null}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500 font-mono">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatLastUpdated(session.updated_at || session.created_at)}</span>
                      </span>
                      {session.model && <span>• {session.model}</span>}
                    </div>
                  </div>

                  {/* Hover Actions (Rename, Pin, Archive, Delete) */}
                  {!isEditing && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePinSession(session.id);
                        }}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400"
                        title={session.is_pinned ? 'Unpin' : 'Pin'}
                        aria-label={session.is_pinned ? 'Unpin conversation' : 'Pin conversation'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => startRename(e, session)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                        title="Rename"
                        aria-label="Rename conversation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchiveSession(session.id, !session.is_archived);
                        }}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-amber-400"
                        title={session.is_archived ? 'Unarchive' : 'Archive'}
                        aria-label={
                          session.is_archived ? 'Unarchive conversation' : 'Archive conversation'
                        }
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this conversation session?')) {
                            onDeleteSession(session.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400"
                        title="Delete"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
