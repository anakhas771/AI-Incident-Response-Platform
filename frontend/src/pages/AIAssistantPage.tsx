import React, { useEffect, useState, useCallback } from 'react';
import { useChatStore } from '../stores/useChatStore';
import { useIncidentStore } from '../stores/useIncidentStore';
import { useCommandStore } from '../stores/useCommandStore';
import { ConversationList } from '../components/chat/ConversationList';
import { ChatWindow } from '../components/chat/ChatWindow';
import { KeyboardShortcutsModal } from '../components/navigation/KeyboardShortcutsModal';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { ChatErrorBoundary } from '../components/ui/ChatErrorBoundary';
import { SourceDrawer } from '../components/chat/SourceDrawer';
import { Citation } from '../types/chat';
import { Shield, Menu, X } from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  const {
    sessions,
    activeSessionId,
    messages,
    isStreaming,
    isLoadingSessions,
    loadSessions,
    createSession,
    selectSession,
    renameSession,
    togglePinSession,
    deleteSession,
    sendMessage,
    stopGeneration,
    regenerateMessage,
  } = useChatStore();

  const { incidents } = useIncidentStore();
  const { setShortcutsOpen } = useCommandStore();
  const [selectedIncidentId, setSelectedIncidentId] = useState(incidents[0]?.id || '');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const activeIncident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];
  console.log('sessions =', sessions);
  console.log('isArray =', Array.isArray(sessions));
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const currentMessages = activeSessionId ? messages[activeSessionId] || [] : [];

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      selectSession(sessions[0].id);
    }
  }, [activeSessionId, sessions, selectSession]);

  // Global Keyboard shortcuts: ? for shortcuts, Ctrl+N for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable;

      if (!isInput && e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(true);
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createSession('New Investigation');
      }

      if (e.key === 'Escape' && selectedCitation) {
        setSelectedCitation(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShortcutsOpen, createSession, selectedCitation]);

  const handleNewChat = useCallback(() => {
    createSession(
      activeIncident ? `Investigation: ${activeIncident.title}` : 'New Security Investigation'
    );
    setMobileDrawerOpen(false);
  }, [createSession, activeIncident]);

  const handleSendMessageWithContext = (text: string) => {
    const context = activeIncident
      ? `[INCIDENT CONTEXT: ${activeIncident.id} - ${activeIncident.title} (${activeIncident.severity})] `
      : '';
    sendMessage(context + text);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 relative overflow-hidden">
      {/* Offline Alert Banner */}
      <OfflineBanner />

      {/* Context / Incident Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/60 border-b border-zinc-800 text-xs text-zinc-400 shrink-0">
        <div className="flex items-center gap-2">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-1 rounded hover:bg-zinc-800 text-zinc-300"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Incident Context:</span>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-0.5 font-medium focus:outline-none focus:border-indigo-500"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.title} ({inc.severity})
              </option>
            ))}
          </select>
        </div>

        {activeIncident && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-zinc-500 font-mono">ID: {activeIncident.id}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                activeIncident.severity === 'CRITICAL'
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {activeIncident.severity}
            </span>
          </div>
        )}
      </div>

      {/* Main Workspace Grid: ConversationList + ChatWindow */}
      <ChatErrorBoundary>
        <div className="flex flex-1 min-h-0 relative">
          {/* Sidebar for Desktop */}
          <div className="hidden md:block h-full">
            <ConversationList
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={(id) => selectSession(id)}
              onCreateSession={handleNewChat}
              onRenameSession={(id, title) => renameSession(id, title)}
              onTogglePinSession={(id) => togglePinSession(id)}
              onDeleteSession={(id) => deleteSession(id)}
              isLoading={isLoadingSessions}
            />
          </div>

          {/* Sidebar Drawer for Mobile */}
          {mobileDrawerOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <div className="w-72 h-full bg-zinc-900 border-r border-zinc-800">
                <div className="flex items-center justify-between p-3 border-b border-zinc-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Sessions
                  </span>
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <ConversationList
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onSelectSession={(id) => {
                    selectSession(id);
                    setMobileDrawerOpen(false);
                  }}
                  onCreateSession={handleNewChat}
                  onRenameSession={(id, title) => renameSession(id, title)}
                  onTogglePinSession={(id) => togglePinSession(id)}
                  onDeleteSession={(id) => deleteSession(id)}
                  isLoading={isLoadingSessions}
                />
              </div>
              <div
                className="flex-1 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileDrawerOpen(false)}
              />
            </div>
          )}

          {/* Chat Window Main Area */}
          <ChatWindow
            session={activeSession}
            messages={currentMessages}
            isStreaming={isStreaming}
            onSendMessage={handleSendMessageWithContext}
            onStopGeneration={stopGeneration}
            onRegenerateMessage={regenerateMessage}
            onSelectSuggestedQuestion={(q) => handleSendMessageWithContext(q)}
            onOpenShortcutsModal={() => setShortcutsOpen(true)}
            onOpenCitation={(citation) => setSelectedCitation(citation)}
          />
        </div>
      </ChatErrorBoundary>

      {/* Verified Source Inspection Drawer */}
      <SourceDrawer
        isOpen={!!selectedCitation}
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal />
    </div>
  );
};

export default AIAssistantPage;
