import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CopilotSession, CopilotMessage, CopilotModel, CopilotCitation } from '../types';
import { CopilotMessageBubble } from './CopilotMessageBubble';
import { CopilotComposer } from './CopilotComposer';
import { CopilotCitationDrawer } from './CopilotCitationDrawer';
import { Shield, Sparkles, RefreshCw, AlertCircle, Cpu, Award } from 'lucide-react';

export interface CopilotChatWindowProps {
  session: CopilotSession | null;
  messages: CopilotMessage[];
  isStreaming: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  currentModel: CopilotModel;
  tokenUsage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  confidenceScore: { score: number; level?: string } | null;
  onSendPrompt: (prompt: string) => Promise<void> | void;
  onStopGeneration: () => void;
  onRegenerate: () => Promise<void> | void;
  onRetry: () => Promise<void> | void;
  onSelectModel?: (model: CopilotModel) => void;
  onOpenShortcuts?: () => void;
  onNewSession?: () => void;
  onOpenSearch?: () => void;
  onClearError?: () => void;
  onOpenDocumentPanel?: (docId: string) => void;
}

/**
 * Enterprise Chat Window orchestrating message rendering, sticky composer, citations drawer, auto-scroll, and badges.
 */
export const CopilotChatWindow: React.FC<CopilotChatWindowProps> = React.memo(
  ({
    session,
    messages,
    isStreaming,
    isLoadingMessages,
    error,
    currentModel,
    tokenUsage,
    confidenceScore,
    onSendPrompt,
    onStopGeneration,
    onRegenerate,
    onRetry,
    onSelectModel,
    onOpenShortcuts,
    onNewSession,
    onOpenSearch,
    onClearError,
    onOpenDocumentPanel,
  }) => {
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const [selectedCitation, setSelectedCitation] = useState<CopilotCitation | null>(null);
    const [composerInitialPrompt, setComposerInitialPrompt] = useState('');

    // Smooth auto-scroll to bottom on message or token updates
    const scrollToBottom = useCallback((smooth = true) => {
      if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
        messagesEndRef.current.scrollIntoView({
          behavior: smooth ? 'smooth' : 'auto',
          block: 'end',
        });
      }
    }, []);

    useEffect(() => {
      scrollToBottom(false);
    }, [session?.id, scrollToBottom]);

    useEffect(() => {
      scrollToBottom(true);
    }, [messages.length, scrollToBottom]);

    const handleEditPrompt = useCallback((content: string) => {
      setComposerInitialPrompt(content);
    }, []);

    const handleCitationClick = useCallback((citation: CopilotCitation) => {
      setSelectedCitation(citation);
    }, []);

    return (
      <div className="flex-1 flex flex-col h-full bg-zinc-950 relative min-w-0">
        {/* Workspace Header Bar */}
        <header className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-zinc-100 truncate">
                {session ? session.title : 'Enterprise AI Copilot'}
              </h2>
              <p className="text-[11px] text-zinc-400 font-mono truncate">
                {session ? `Session ID: ${session.id}` : 'Select or create a conversation'}
              </p>
            </div>
          </div>

          {/* Header Badges: Active Token Usage & Confidence */}
          <div className="hidden md:flex items-center gap-2">
            {confidenceScore && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
                <Award className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Confidence: {confidenceScore.score}% ({confidenceScore.level || 'HIGH'})
                </span>
              </span>
            )}

            {tokenUsage.total_tokens > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs font-mono">
                <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                <span>Tokens: {tokenUsage.total_tokens}</span>
              </span>
            )}
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div
            className="flex items-center justify-between px-4 py-2.5 bg-rose-950/80 border-b border-rose-800/80 text-rose-300 text-xs"
            role="alert"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Copilot Notice:</strong> {error}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRetry}
                className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-medium transition-colors"
                aria-label="Retry request"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              {onClearError && (
                <button
                  onClick={onClearError}
                  className="px-2 py-1 rounded hover:bg-rose-900/40 text-rose-400 font-medium transition-colors"
                  aria-label="Dismiss error banner"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Message Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
          role="log"
          aria-label="Conversation Messages"
        >
          {/* Loading Messages Skeleton */}
          {isLoadingMessages ? (
            <div className="space-y-4 max-w-4xl mx-auto">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-4 rounded bg-zinc-800 animate-pulse" />
                    <div className="w-full h-16 rounded bg-zinc-900 animate-pulse border border-zinc-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-100">Enterprise AI Copilot</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Your production-grade security and RAG assistant. Grounded in enterprise runbooks,
                cluster telemetry, and dbSNP/ClinVar/knowledge bases.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 w-full text-left">
                {[
                  'Analyze memory leak pattern in PostgreSQL primary pool',
                  'Summarize root cause for Incident INC-1042',
                  'What is the standard SLA for critical database incidents?',
                  'Generate remediation SQL query for idle in transaction',
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendPrompt(q)}
                    className="p-2.5 rounded-lg bg-zinc-900/70 hover:bg-indigo-500/10 border border-zinc-800 hover:border-indigo-500/40 text-xs text-zinc-300 hover:text-indigo-200 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages Feed */
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((message, idx) => {
                const isLatestAssistant =
                  message.role === 'assistant' &&
                  idx === messages.length - 1 &&
                  !message.isStreaming;

                return (
                  <CopilotMessageBubble
                    key={message.id}
                    message={message}
                    isLatestAssistant={isLatestAssistant}
                    onCitationClick={handleCitationClick}
                    onSelectSuggestedQuestion={(q) => onSendPrompt(q)}
                    onEditPrompt={handleEditPrompt}
                    onRetry={onRetry}
                    onRegenerate={onRegenerate}
                  />
                );
              })}

              <div ref={messagesEndRef} className="h-1" />
            </div>
          )}
        </div>

        {/* Sticky Composer */}
        <CopilotComposer
          isStreaming={isStreaming}
          currentModel={currentModel}
          onSendPrompt={onSendPrompt}
          onStopGeneration={onStopGeneration}
          onSelectModel={onSelectModel}
          onOpenShortcuts={onOpenShortcuts}
          onNewSession={onNewSession}
          onOpenSearch={onOpenSearch}
          initialPrompt={composerInitialPrompt}
        />

        {/* Citation Drawer Modal */}
        <CopilotCitationDrawer
          isOpen={Boolean(selectedCitation)}
          citation={selectedCitation}
          onClose={() => setSelectedCitation(null)}
          onOpenDocumentPanel={onOpenDocumentPanel}
        />
      </div>
    );
  }
);

CopilotChatWindow.displayName = 'CopilotChatWindow';
