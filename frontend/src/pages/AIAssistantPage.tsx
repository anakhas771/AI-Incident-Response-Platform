import React, { useEffect, useState, useCallback } from 'react';
import { useCopilotChat } from '../features/copilot/hooks/useCopilotChat';
import { CopilotSidebar, CopilotChatWindow } from '../features/copilot/components';
import { useIncidentStore } from '../stores/useIncidentStore';
import { useCommandStore } from '../stores/useCommandStore';
import { KeyboardShortcutsModal } from '../components/navigation/KeyboardShortcutsModal';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { ChatErrorBoundary } from '../components/ui/ChatErrorBoundary';
import { Shield, Menu, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Enterprise AI Copilot Page
 * production-quality assistant combining RAG knowledge, telemetry analysis, and automated runbook execution.
 */
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
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 relative overflow-hidden">
      {/* Offline Alert Banner */}
      <OfflineBanner />

      {/* Enterprise Incident Context Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/60 border-b border-zinc-800 text-xs text-zinc-400 shrink-0">
        <div className="flex items-center gap-2">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-1 rounded hover:bg-zinc-800 text-zinc-300"
            aria-label="Toggle copilot sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Enterprise Copilot Context:</span>
          </div>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            aria-label="Select Incident Context"
            className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1 font-medium focus:outline-none focus:border-indigo-500 transition-colors"
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
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                activeIncident.severity === 'CRITICAL'
                  ? 'bg-rose-950/80 text-rose-400 border-rose-800'
                  : 'bg-amber-950/80 text-amber-400 border-amber-800'
              }`}
            >
              {activeIncident.severity}
            </span>
          </div>
        )}
      </div>

      {/* Main Workspace Grid: CopilotSidebar + CopilotChatWindow */}
      <ChatErrorBoundary>
        <div className="flex flex-1 min-h-0 relative">
          {/* Sidebar for Desktop */}
          <div className="hidden md:block h-full">
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

          {/* Sidebar Drawer for Mobile */}
          {mobileDrawerOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <div className="w-72 h-full bg-zinc-900 border-r border-zinc-800">
                <div className="flex items-center justify-between p-3 border-b border-zinc-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Investigations</span>
                  </div>
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
                    aria-label="Close mobile sidebar"
                  >
                    <X className="w-4 h-4" />
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

          {/* Chat Window Workspace */}
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

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal />
    </div>
  );
};

export default AIAssistantPage;
