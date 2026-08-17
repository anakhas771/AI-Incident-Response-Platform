import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CopilotSession, CopilotMessage, CopilotModel, CopilotCitation } from '../types';
import { CopilotMessageBubble } from './CopilotMessageBubble';
import { CopilotComposer } from './CopilotComposer';
import { CopilotCitationDrawer } from './CopilotCitationDrawer';
import { Shield, RefreshCw, AlertCircle, Cpu, Award } from 'lucide-react';

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
    const [selectedCitation, setSelectedCitation] = useState<CopilotCitation | null>(null);
    const [composerInitialPrompt, setComposerInitialPrompt] = useState('');

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
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950 text-zinc-100">
        <header className="relative flex shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/95 px-4 py-3.5 backdrop-blur-xl sm:px-5">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 shadow-sm">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-semibold tracking-tight text-zinc-100">
                  {session ? session.title : 'Copilot'}
                </h2>
                <span className="hidden rounded-full border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500 sm:inline-flex">
                  Secure
                </span>
              </div>
              <p className="truncate text-[11px] text-zinc-500">
                {session ? 'Incident investigation' : 'Select or create a conversation'}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {confidenceScore && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-zinc-300">
                  <Award className="h-3.5 w-3.5 text-zinc-500" />
                  {confidenceScore.score}% confidence
                </div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                  {confidenceScore.level || 'High'}
                </p>
              </div>
            )}

            {tokenUsage.total_tokens > 0 && (
              <div className="border-l border-zinc-800 pl-4 text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs font-mono text-zinc-400">
                  <Cpu className="h-3.5 w-3.5 text-zinc-600" />
                  Tokens: {tokenUsage.total_tokens.toLocaleString()}
                </div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Usage</p>
              </div>
            )}
          </div>
        </header>

        {error && (
          <div
            className="flex items-center justify-between border-b border-rose-900/60 bg-rose-950/30 px-4 py-2.5 text-xs text-rose-300 sm:px-5"
            role="alert"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRetry}
                className="flex items-center gap-1 rounded-md px-2 py-1 font-medium text-rose-200 transition-colors hover:bg-rose-900/40"
                aria-label="Retry request"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
              {onClearError && (
                <button
                  onClick={onClearError}
                  className="rounded-md px-2 py-1 font-medium text-rose-400 transition-colors hover:bg-rose-900/30"
                  aria-label="Dismiss error banner"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        <div
          className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6 sm:py-6 lg:px-8"
          role="log"
          aria-label="Conversation Messages"
        >
          {isLoadingMessages ? (
            <div className="mx-auto max-w-4xl space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-7 w-7 shrink-0 animate-pulse rounded-md bg-zinc-900" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-zinc-900" />
                    <div className="h-14 w-full animate-pulse rounded bg-zinc-900/70" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full min-h-[420px] items-center justify-center">
              <div className="max-w-xl px-5 text-center sm:px-6">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 shadow-sm">
                  <Shield className="h-5 w-5" />
                </div>
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                  Investigation workspace
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-zinc-100">
                  Start an investigation
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  Ask about incidents, telemetry, runbooks, operational procedures, or supporting
                  evidence from the knowledge base.
                </p>
                <div className="mt-6 grid gap-2 text-left sm:grid-cols-2">
                  {[
                    'Analyze memory leak pattern in PostgreSQL primary pool',
                    'Summarize root cause for Incident INC-1042',
                    'What is the standard SLA for critical database incidents?',
                    'Generate remediation SQL query for idle in transaction',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => onSendPrompt(q)}
                      className="rounded-md border border-zinc-800/90 bg-zinc-900/30 px-3 py-2.5 text-xs leading-5 text-zinc-400 transition-all hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-200"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-7">
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
