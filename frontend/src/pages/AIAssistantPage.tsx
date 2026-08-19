import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useCopilotChat } from '../features/copilot/hooks/useCopilotChat';
import { CopilotSidebar, CopilotChatWindow } from '../features/copilot/components';
import { useIncidentStore } from '../stores/useIncidentStore';
import { useCommandStore } from '../stores/useCommandStore';
import { KeyboardShortcutsModal } from '../components/navigation/KeyboardShortcutsModal';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { ChatErrorBoundary } from '../components/ui/ChatErrorBoundary';
import { Menu, X, Sparkles, Activity, ShieldCheck } from 'lucide-react';
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="relative isolate flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#08090d] text-zinc-100"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/[0.11] blur-3xl"
          animate={{ x: [0, 45, 0], y: [0, 30, 0], opacity: [0.42, 0.68, 0.42] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-cyan-400/[0.07] blur-3xl"
          animate={{ x: [0, -35, 0], y: [0, 40, 0], opacity: [0.30, 0.50, 0.30] }}
          transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-8rem] left-1/3 h-96 w-96 rounded-full bg-violet-500/[0.055] blur-3xl"
          animate={{ x: [0, 30, 0], opacity: [0.22, 0.42, 0.22] }}
          transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.07),transparent_35%),radial-gradient(circle_at_82%_82%,rgba(34,211,238,0.035),transparent_30%)]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <OfflineBanner />

        <div className="shrink-0 border-b border-white/[0.06] bg-zinc-950/70 px-4 py-3 backdrop-blur-2xl sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-2 text-zinc-500 transition hover:border-indigo-400/20 hover:bg-indigo-400/[0.05] hover:text-zinc-200 md:hidden"
                aria-label="Toggle copilot sidebar"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="hidden items-center gap-2 sm:flex">
                <span className="rounded-xl border border-indigo-400/15 bg-indigo-400/[0.07] p-2 text-indigo-300">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300/70">AI Copilot</p>
                  <p className="text-xs text-zinc-500">Security investigation workspace</p>
                </div>
              </div>

              <select
                value={selectedIncidentId}
                onChange={(e) => setSelectedIncidentId(e.target.value)}
                aria-label="Select Incident Context"
                className="min-w-0 max-w-[min(68vw,560px)] rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs font-medium text-zinc-300 outline-none transition focus:border-indigo-400/30 focus:bg-white/[0.04] focus:text-zinc-100"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    {inc.title} ({inc.severity})
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden items-center gap-2 text-[10px] font-mono sm:flex">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/10 bg-emerald-400/[0.04] px-2.5 py-1 text-emerald-300/80">
                <Activity className="h-3 w-3" />
                {isStreaming ? 'Streaming' : 'Ready'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-zinc-500">
                <ShieldCheck className="h-3 w-3 text-indigo-300/70" />
                {typeof currentModel === 'string' ? currentModel : 'Copilot'}
              </span>
            </div>
          </div>

          {activeIncident && (
            <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-zinc-600 sm:hidden">
              <span className="text-indigo-300/60">{activeIncident.id}</span>
              <span className="rounded-full border border-rose-400/10 bg-rose-400/[0.04] px-2 py-0.5 text-rose-300/70">
                {activeIncident.severity}
              </span>
            </div>
          )}
        </div>

        <ChatErrorBoundary>
          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="sticky top-0 hidden h-full min-h-0 shrink-0 self-start border-r border-white/[0.06] bg-zinc-950/35 md:block"
            >
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
            </motion.div>

            {mobileDrawerOpen && (
              <div className="fixed inset-0 z-50 flex md:hidden">
                <motion.div
                  initial={{ x: -24, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.28 }}
                  className="h-full w-[min(88vw,21rem)] border-r border-white/[0.08] bg-zinc-950/95 shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-300/70">Investigations</p>
                    <button
                      onClick={() => setMobileDrawerOpen(false)}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5 text-zinc-600 transition-colors hover:bg-white/[0.05] hover:text-zinc-200"
                      aria-label="Close mobile sidebar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="h-[calc(100%-3.25rem)]">
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
                </motion.div>
                <div className="flex-1 bg-black/65 backdrop-blur-sm" onClick={() => setMobileDrawerOpen(false)} />
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-0 min-w-0 flex-1 bg-white/[0.008]"
            >
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
            </motion.div>
          </div>
        </ChatErrorBoundary>

        <KeyboardShortcutsModal />
      </div>
    </motion.div>
  );
};

export default AIAssistantPage;
