import React, { useEffect, useState, useCallback } from 'react';
import { useCopilotChat } from '../features/copilot/hooks/useCopilotChat';
import { CopilotSidebar, CopilotChatWindow } from '../features/copilot/components';
import { useIncidentStore } from '../stores/useIncidentStore';
import { useCommandStore } from '../stores/useCommandStore';
import { KeyboardShortcutsModal } from '../components/navigation/KeyboardShortcutsModal';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { ChatErrorBoundary } from '../components/ui/ChatErrorBoundary';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AIAssistantPage: React.FC = () => {
  const {
    filteredSessions,
    activeSession,
    activeSessionId,
    messages,
    isStreaming,
    isLoadingSessions,
    isLoadingMessages,
    error,
    searchQuery,
    filter,
    tokenUsage,
    confidenceScore,
    currentModel,
    loadSessions,
    createSession,
    selectSession,
    renameSession,
    archiveSession,
    togglePinSession,
    deleteSession,
    sendPrompt,
    stopGeneration,
    regenerateResponse,
    retryResponse,
    setSearchQuery,
    setFilter,
    setCurrentModel,
    clearError,
  } = useCopilotChat();

  const { incidents } = useIncidentStore();
  const { setShortcutsOpen } = useCommandStore();
  const navigate = useNavigate();

  const [selectedIncidentId, setSelectedIncidentId] = useState(incidents[0]?.id || '');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const activeIncident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!activeSessionId && filteredSessions.length > 0) {
      selectSession(filteredSessions[0].id);
    }
  }, [activeSessionId, filteredSessions, selectSession]);

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
        createSession(
          activeIncident ? `Investigation: ${activeIncident.title}` : 'New Security Investigation'
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShortcutsOpen, createSession, activeIncident]);

  const handleNewChat = useCallback(() => {
    createSession(
      activeIncident ? `Investigation: ${activeIncident.title}` : 'New Security Investigation'
    );
    setMobileDrawerOpen(false);
  }, [createSession, activeIncident]);

  const handleSendMessageWithContext = useCallback(
    async (text: string) => {
      const context = activeIncident
        ? `[INCIDENT CONTEXT: ${activeIncident.id} - ${activeIncident.title} (${activeIncident.severity})] `
        : '';
      await sendPrompt(context + text);
    },
    [activeIncident, sendPrompt]
  );

  const handleOpenDocumentPanel = useCallback(
    (docId: string) => {
      navigate(`/knowledge/${docId}`);
    },
    [navigate]
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <OfflineBanner />

      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950 px-4 py-2.5 text-xs">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200 md:hidden"
            aria-label="Toggle copilot sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="hidden shrink-0 sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
              Investigation context
            </p>
          </div>

          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            aria-label="Select Incident Context"
            className="min-w-0 max-w-[min(65vw,520px)] bg-transparent text-xs font-medium text-zinc-300 outline-none transition-colors focus:text-zinc-100"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.title} ({inc.severity})
              </option>
            ))}
          </select>
        </div>

        {activeIncident && (
          <div className="hidden items-center gap-3 text-[10px] font-mono text-zinc-600 sm:flex">
            <span>{activeIncident.id}</span>
            <span>{activeIncident.severity}</span>
          </div>
        )}
      </div>

      <ChatErrorBoundary>
        <div className="relative flex min-h-0 flex-1">
          <div className="hidden h-full md:block">
            <CopilotSidebar
              sessions={filteredSessions}
              activeSessionId={activeSessionId}
              isLoading={isLoadingSessions}
              searchQuery={searchQuery}
              filter={filter}
              onSelectSession={(id) => selectSession(id)}
              onCreateSession={handleNewChat}
              onRenameSession={(id, title) => renameSession(id, title)}
              onTogglePinSession={(id) => togglePinSession(id)}
              onArchiveSession={(id, isArchived) => archiveSession(id, isArchived)}
              onDeleteSession={(id) => deleteSession(id)}
              onSearchChange={(q) => setSearchQuery(q)}
              onFilterChange={(f) => setFilter(f)}
            />
          </div>

          {mobileDrawerOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div className="h-full w-72 border-r border-zinc-800 bg-zinc-950">
                <div className="flex items-center justify-between border-b border-zinc-800/80 px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    Investigations
                  </p>
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                    aria-label="Close mobile sidebar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <CopilotSidebar
                  sessions={filteredSessions}
                  activeSessionId={activeSessionId}
                  isLoading={isLoadingSessions}
                  searchQuery={searchQuery}
                  filter={filter}
                  onSelectSession={(id) => {
                    selectSession(id);
                    setMobileDrawerOpen(false);
                  }}
                  onCreateSession={handleNewChat}
                  onRenameSession={(id, title) => renameSession(id, title)}
                  onTogglePinSession={(id) => togglePinSession(id)}
                  onArchiveSession={(id, isArchived) => archiveSession(id, isArchived)}
                  onDeleteSession={(id) => deleteSession(id)}
                  onSearchChange={(q) => setSearchQuery(q)}
                  onFilterChange={(f) => setFilter(f)}
                />
              </div>
              <div
                className="flex-1 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileDrawerOpen(false)}
              />
            </div>
          )}

          <CopilotChatWindow
            session={activeSession}
            messages={messages}
            isStreaming={isStreaming}
            isLoadingMessages={isLoadingMessages}
            error={error}
            currentModel={currentModel}
            tokenUsage={tokenUsage}
            confidenceScore={confidenceScore}
            onSendPrompt={handleSendMessageWithContext}
            onStopGeneration={stopGeneration}
            onRegenerate={regenerateResponse}
            onRetry={retryResponse}
            onSelectModel={setCurrentModel}
            onOpenShortcuts={() => setShortcutsOpen(true)}
            onNewSession={handleNewChat}
            onOpenSearch={() => setSearchQuery('')}
            onClearError={clearError}
            onOpenDocumentPanel={handleOpenDocumentPanel}
          />
        </div>
      </ChatErrorBoundary>

      <KeyboardShortcutsModal />
    </div>
  );
};

export default AIAssistantPage;
