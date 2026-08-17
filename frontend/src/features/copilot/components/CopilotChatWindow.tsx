import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950 text-zinc-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,0.045),transparent_24%),radial-gradient(circle_at_80%_55%,rgba(34,211,238,0.035),transparent_22%)]" />

        <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-4 py-3.5 backdrop-blur-xl sm:px-5">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-400/15 bg-indigo-400/[0.06] text-indigo-200 shadow-[0_0_24px_rgba(99,102,241,0.08)]">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-semibold tracking-tight text-zinc-100">
                  {session ? session.title : 'Copilot'}
                </h2>
                <span className="hidden rounded-full border border-emerald-400/10 bg-emerald-400/[0.035] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-emerald-300/60 sm:inline-flex">
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
                  <Award className="h-3.5 w-3.5 text-indigo-300/60" />
                  {confidenceScore.score}% confidence
                </div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-indigo-300/40">
                  {confidenceScore.level || 'High'}
                </p>
              </div>
            )}

            {tokenUsage.total_tokens > 0 && (
              <div className="border-l border-zinc-800 pl-4 text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs font-mono text-zinc-400">
                  <Cpu className="h-3.5 w-3.5 text-cyan-300/40" />
                  <span>Tokens: {tokenUsage.total_tokens.toLocaleString()}</span>
                </div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Usage</p>
              </div>
            )}
          </div>
        </header>

        {error && (
          <div
            className="relative z-10 flex shrink-0 items-center justify-between border-b border-rose-900/60 bg-rose-950/30 px-4 py-2.5 text-xs text-rose-300 sm:px-5"
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
          className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 sm:px-6 sm:py-6 lg:px-8"
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
            <motion.div
              initial={{ opacity: 0, y: 18, filter: 'blur(5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex h-full min-h-[420px] items-center justify-center"
            >
              <div className="max-w-xl px-5 text-center sm:px-6">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-indigo-400/15 bg-indigo-400/[0.05] text-indigo-200 shadow-[0_0_32px_rgba(99,102,241,0.1)]">
                  <Shield className="h-5 w-5" />
                </div>
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300/45">
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
                  ].map((q, index) => (
                    <motion.button
                      key={q}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 + index * 0.08, duration: 0.45 }}
                      onClick={() => onSendPrompt(q)}
                      className="rounded-md border border-zinc-800/90 bg-zinc-900/30 px-3 py-2.5 text-xs leading-5 text-zinc-400 transition-all hover:border-indigo-400/20 hover:bg-indigo-400/[0.04] hover:text-zinc-200"
                    >
                      {q}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-7 pb-4">
              <AnimatePresence initial mode="popLayout">
                {messages.map((message, idx) => {
                  const isLatestAssistant =
                    message.role === 'assistant' &&
                    idx === messages.length - 1 &&
                    !message.isStreaming;

                  return (
                    <motion.div
                      key={message.id}
                      layout="position"
                      initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
                      transition={{
                        duration: 0.55,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <CopilotMessageBubble
                        message={message}
                        isLatestAssistant={isLatestAssistant}
                        onCitationClick={handleCitationClick}
                        onSelectSuggestedQuestion={(q) => onSendPrompt(q)}
                        onEditPrompt={handleEditPrompt}
                        onRetry={onRetry}
                        onRegenerate={onRegenerate}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} className="h-1" />
            </div>
          )}
        </div>

        <div className="relative z-10 shrink-0">
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
        </div>

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
