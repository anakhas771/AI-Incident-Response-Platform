import React, { useState, useRef, useEffect } from 'react';
import { CopilotModel } from '../types';
import { Send, Square, HelpCircle } from 'lucide-react';

export interface CopilotComposerProps {
  isStreaming: boolean;
  currentModel: CopilotModel;
  onSendPrompt: (prompt: string) => Promise<void> | void;
  onStopGeneration: () => void;
  onSelectModel?: (model: CopilotModel) => void;
  onOpenShortcuts?: () => void;
  onNewSession?: () => void;
  onOpenSearch?: () => void;
  initialPrompt?: string;
}

export const CopilotComposer: React.FC<CopilotComposerProps> = React.memo(
  ({
    isStreaming,
    currentModel,
    onSendPrompt,
    onStopGeneration,
    onSelectModel,
    onOpenShortcuts,
    onNewSession,
    onOpenSearch,
    initialPrompt = '',
  }) => {
    const [prompt, setPrompt] = useState(initialPrompt);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
      if (initialPrompt) {
        setPrompt(initialPrompt);
      }
    }, [initialPrompt]);

    useEffect(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
      }
    }, [prompt]);

    const handleSubmit = () => {
      const trimmed = prompt.trim();
      if (!trimmed || isStreaming) return;
      onSendPrompt(trimmed);
      setPrompt('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
        return;
      }

      if (e.key === 'Escape' && isStreaming) {
        e.preventDefault();
        onStopGeneration();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && onNewSession) {
        e.preventDefault();
        onNewSession();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && onOpenSearch) {
        e.preventDefault();
        onOpenSearch();
      }
    };

    const isSubmitDisabled = !prompt.trim() || isStreaming;

    return (
      <div className="sticky bottom-0 z-20 w-full border-t border-zinc-800/80 bg-zinc-950 px-3 py-3 sm:px-5 sm:py-4">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/70 transition-colors focus-within:border-zinc-700 focus-within:bg-zinc-900">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about incidents, telemetry, runbooks, or evidence…"
              rows={1}
              aria-label="Enterprise Copilot Prompt Input"
              className="w-full resize-none overflow-y-auto bg-transparent px-4 py-3.5 text-sm leading-6 text-zinc-100 placeholder-zinc-600 focus:outline-none"
            />

            <div className="flex items-center justify-between border-t border-zinc-800/70 px-3 py-2">
              <div className="flex items-center gap-2 text-xs">
                <select
                  value={currentModel}
                  onChange={(e) => onSelectModel?.(e.target.value as CopilotModel)}
                  className="max-w-[230px] bg-transparent font-medium text-zinc-400 focus:outline-none"
                  aria-label="Select AI Engine Model"
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="enterprise-rag">Enterprise RAG</option>
                </select>

                {onOpenShortcuts && (
                  <button
                    onClick={onOpenShortcuts}
                    className="hidden items-center gap-1 rounded px-1.5 py-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300 sm:flex"
                    aria-label="View Keyboard Shortcuts"
                    title="Press ? for shortcuts"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    Shortcuts
                  </button>
                )}
              </div>

              {isStreaming ? (
                <button
                  onClick={onStopGeneration}
                  className="inline-flex items-center gap-1.5 rounded-md border border-rose-900/60 bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-950/40"
                  aria-label="Stop generating response"
                  title="Stop generation (Esc)"
                >
                  <Square className="h-3.5 w-3.5 fill-rose-400" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitDisabled}
                  className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
                  aria-label="Send prompt to Enterprise Copilot"
                  title="Send message (Enter)"
                >
                  Send
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <p className="mt-2 text-center text-[10px] text-zinc-700">
            Enter to send · Shift+Enter for a new line · Esc to stop generation
          </p>
        </div>
      </div>
    );
  }
);

CopilotComposer.displayName = 'CopilotComposer';
