import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Pin,
  PinOff,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { ChatSession } from '../../types/chat';

export interface ConversationListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePinSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  isLoading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onTogglePinSession,
  onDeleteSession,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'recent'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editingId && editingTitle.trim()) {
      onRenameSession(editingId, editingTitle.trim());
      setEditingId(null);
    }
  };

  const handleCancelRename = () => {
    setEditingId(null);
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filter === 'pinned' && !s.is_pinned) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesPreview = (s.last_message_preview || '').toLowerCase().includes(q);
        return matchesTitle || matchesPreview;
      }
      return true;
    });
  }, [sessions, filter, searchQuery]);

  const { pinnedSessions, todaySessions, earlierSessions } = useMemo(() => {
    const pinned: ChatSession[] = [];
    const today: ChatSession[] = [];
    const earlier: ChatSession[] = [];

    const now = new Date();
    const todayStr = now.toDateString();

    for (const session of filteredSessions) {
      if (session.is_pinned) {
        pinned.push(session);
        continue;
      }
      const sessionDate = session.last_message_at
        ? new Date(session.last_message_at)
        : new Date(session.updated_at || session.created_at);
      if (sessionDate.toDateString() === todayStr) {
        today.push(session);
      } else {
        earlier.push(session);
      }
    }

    return {
      pinnedSessions: pinned,
      todaySessions: today,
      earlierSessions: earlier,
    };
  }, [filteredSessions]);

  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId;
    const isEditing = session.id === editingId;

    return (
      <div
        key={session.id}
        onClick={() => !isEditing && onSelectSession(session.id)}
        className={`group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
          isActive
            ? 'bg-indigo-950/40 border-indigo-500/40 text-white shadow-sm'
            : 'bg-zinc-900/50 hover:bg-zinc-900 border-transparent hover:border-zinc-800 text-zinc-300'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare
            className={`w-4 h-4 shrink-0 ${
              isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-400'
            }`}
          />
          {isEditing ? (
            <form
              onSubmit={handleSaveRename}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 flex-1 min-w-0"
            >
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                className="w-full px-2 py-1 rounded bg-zinc-800 border border-indigo-500 text-xs text-zinc-100 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="p-1 hover:bg-emerald-950 text-emerald-400 rounded"
                title="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancelRename}
                className="p-1 hover:bg-rose-950 text-rose-400 rounded"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs truncate block">{session.title}</span>
              </div>
              {session.last_message_preview && (
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                  {session.last_message_preview}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action icons */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePinSession(session.id);
              }}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              title={session.is_pinned ? 'Unpin session' : 'Pin session'}
            >
              {session.is_pinned ? (
                <PinOff className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Pin className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={(e) => handleStartRename(e, session)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              title="Rename session"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete conversation "${session.title}"?`)) {
                  onDeleteSession(session.id);
                }
              }}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400"
              title="Delete session"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800/80 w-72 shrink-0 select-none">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/80 space-y-3">
        <button
          onClick={onCreateSession}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-700/80">⌘N</span>
        </button>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/60"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800/80 text-xs">
          {(['all', 'pinned', 'recent'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-1 rounded-md capitalize font-medium transition-all ${
                filter === tab
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Scroll List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {isLoading ? (
          <div className="space-y-2 py-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-zinc-900/60 animate-pulse border border-zinc-800/40"
              />
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs space-y-2">
            <Clock className="w-8 h-8 mx-auto text-zinc-700" />
            <p>No conversations found</p>
          </div>
        ) : (
          <>
            {pinnedSessions.length > 0 && (
              <div className="space-y-1.5">
                <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                  <Pin className="w-3 h-3 text-indigo-400" />
                  <span>Pinned ({pinnedSessions.length})</span>
                </div>
                {pinnedSessions.map(renderSessionItem)}
              </div>
            )}

            {todaySessions.length > 0 && (
              <div className="space-y-1.5">
                <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Today
                </div>
                {todaySessions.map(renderSessionItem)}
              </div>
            )}

            {earlierSessions.length > 0 && (
              <div className="space-y-1.5">
                <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Earlier
                </div>
                {earlierSessions.map(renderSessionItem)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
