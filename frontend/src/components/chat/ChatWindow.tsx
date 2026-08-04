import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  StopCircle,
  Bot,
  Sparkles,
  ArrowDown,
  Shield,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { ChatMessage, ChatSession, Citation } from '../../types/chat';
import { MessageBubble } from './MessageBubble';

export interface ChatWindowProps {
  session?: ChatSession | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendMessage: (text: string) => void;
  onStopGeneration: () => void;
  onRegenerateMessage: () => void;
  onSelectSuggestedQuestion: (question: string) => void;
  onOpenShortcutsModal?: () => void;
  onOpenCitation?: (citation: Citation) => void;
  onLikeToggle?: (messageId: string, liked: boolean | null) => void;
}

const DEFAULT_SUGGESTED_QUESTIONS = [
  'Generate Root Cause Analysis (RCA) report for the active security incident',
  'Synthesize diagnostic logs and identify SYN flood connection pool anomalies',
  'Draft remediation Go/TypeScript patch for database timeout threshold',
  'Create Executive Summary report for CISO review',
];

export const ChatWindow: React.FC<ChatWindowProps> = ({
  session,
  messages,
  isStreaming,
  onSendMessage,
  onStopGeneration,
  onRegenerateMessage,
  onSelectSuggestedQuestion,
  onOpenShortcutsModal,
  onOpenCitation,
  onLikeToggle,
}) => {
  const [input, setInput] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    const prompt = input.trim();
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape' && isStreaming) {
      e.preventDefault();
      onStopGeneration();
    }
  };

  const scrollToBottom = () => {
    if (virtuosoRef.current && messages.length > 0) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        align: 'end',
        behavior: 'smooth',
      });
      setShowScrollBottom(false);
    }
  };

  // Find last assistant message index
  const lastAssistantIndex = [...messages]
    .map((m, idx) => (m.role === 'assistant' ? idx : -1))
    .filter((idx) => idx !== -1)
    .pop();

  return (
    <div className="flex flex-col h-full bg-zinc-950 flex-1 min-w-0 relative">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-zinc-900/60 border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-zinc-100 truncate flex items-center gap-2">
              <span>{session?.title || 'AI Security Copilot Console'}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 shrink-0">
                GPT-4o SECURITY AGENT
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400 truncate">
              Real-time threat investigation, RCA generation & remediation copilot
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session?.token_count !== undefined && session.token_count > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                Session Tokens:{' '}
                <strong className="text-zinc-200">{session.token_count.toLocaleString()}</strong>
              </span>
            </div>
          )}

          {isStreaming && (
            <button
              onClick={onStopGeneration}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition-all shadow-sm"
              title="Stop response generation (Esc)"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
          )}

          {onOpenShortcutsModal && (
            <button
              onClick={onOpenShortcutsModal}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              title="Keyboard Shortcuts (? or ⌘/)"
              aria-label="Keyboard shortcuts"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message History Area */}
      <div className="flex-1 min-h-0 relative">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-xl">
              <Shield className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-zinc-100">SOC Enterprise Security Copilot</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Connected to enterprise knowledge base, incident telemetry, and diagnostic logs. Ask
                any security or infrastructure question below.
              </p>
            </div>

            <div className="w-full space-y-2 text-left">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium px-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Quick Start Capabilities:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEFAULT_SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectSuggestedQuestion(q)}
                    className="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-indigo-500/50 text-xs text-zinc-300 hover:text-indigo-200 text-left transition-all flex items-start justify-between gap-2 group"
                  >
                    <span>{q}</span>
                    <span className="text-indigo-400/60 group-hover:text-indigo-400 transition-colors shrink-0">
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            followOutput="smooth"
            atBottomStateChange={(atBottom) => {
              setShowScrollBottom(!atBottom);
            }}
            className="h-full w-full"
            itemContent={(index, msg) => (
              <div className="py-2 px-4 md:px-8 max-w-5xl mx-auto">
                <MessageBubble
                  message={msg}
                  isLastAssistant={index === lastAssistantIndex}
                  onRegenerate={onRegenerateMessage}
                  onSelectSuggestedQuestion={onSelectSuggestedQuestion}
                  onOpenCitation={onOpenCitation}
                  onLikeToggle={onLikeToggle}
                />
              </div>
            )}
          />
        )}

        {/* Floating Scroll to Bottom button */}
        {showScrollBottom && messages.length > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-6 flex items-center gap-1.5 px-3 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all z-10"
          >
            <span>Scroll to bottom</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Input Composer Area */}
      <div className="p-4 bg-zinc-900/60 border-t border-zinc-800/80 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-2">
          <div className="relative flex items-end bg-zinc-900 border border-zinc-700/80 hover:border-zinc-600 focus-within:border-indigo-500 rounded-2xl shadow-inner transition-colors">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI Security Copilot anything (e.g. 'Synthesize auth logs' or 'Write RCA')..."
              className="w-full py-3.5 pl-4 pr-12 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none resize-none max-h-40 overflow-y-auto leading-relaxed"
              disabled={isStreaming}
            />

            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md"
                  title="Stop generation (Esc)"
                  aria-label="Stop generation"
                >
                  <StopCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition-all shadow-md disabled:shadow-none"
                  title="Send message (Enter)"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Footer Shortcuts hint */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono">
                  Enter
                </kbd>{' '}
                to send
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono">
                  Shift + Enter
                </kbd>{' '}
                new line
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono">
                  Esc
                </kbd>{' '}
                stop
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono">
                  ⌘N
                </kbd>{' '}
                new chat
              </span>
            </div>
            <span className="hidden sm:inline font-mono text-[10px]">
              Powered by Enterprise Hybrid RAG & Confidence Engine
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
