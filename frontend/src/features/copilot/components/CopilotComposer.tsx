import React, { useState, useRef, useEffect } from 'react';
import { CopilotModel } from '../types';
import { Send, Square, Sparkles, HelpCircle } from 'lucide-react';

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

/**
 * Enterprise sticky composer with auto-resize textarea, model selector, stop generation, and accessible keyboard shortcuts.
 */
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

    // Auto resize textarea up to 6 lines (approx 140px)
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
        return;
      }
    };

    const isSubmitDisabled = !prompt.trim() || isStreaming;

    return (
      <div className="sticky bottom-0 z-20 w-full bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Main Composer Box */}
          <div className="relative flex flex-col rounded-xl bg-zinc-900/90 border border-zinc-800 focus-within:border-indigo-500/60 shadow-xl transition-all">
            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Enterprise Copilot about incidents, runbooks, logs, or SQL telemetry... (Enter to send, Shift+Enter for new line)"
              rows={1}
              aria-label="Enterprise Copilot Prompt Input"
              className="w-full px-4 py-3 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none overflow-y-auto leading-relaxed"
            />

            {/* Bottom Actions Row (Model Selector + Submit/Stop Button) */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800/60 bg-zinc-900/50 rounded-b-xl">
              <div className="flex items-center gap-2">
                {/* Model Selector */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <select
                    value={currentModel}
                    onChange={(e) => onSelectModel?.(e.target.value as CopilotModel)}
                    className="bg-transparent text-zinc-200 font-medium focus:outline-none cursor-pointer"
                    aria-label="Select AI Engine Model"
                  >
                    <option value="gpt-4o">GPT-4o (Reasoning & RAG)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo (Fast Response)</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Code & Analysis)</option>
                    <option value="enterprise-rag">Enterprise RAG (Internal KBs)</option>
                  </select>
                </div>

                {/* Keyboard Shortcuts Hint */}
                {onOpenShortcuts && (
                  <button
                    onClick={onOpenShortcuts}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    aria-label="View Keyboard Shortcuts"
                    title="Press ? for shortcuts"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Shortcuts</span>
                  </button>
                )}
              </div>

              {/* Submit / Stop Buttons */}
              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <button
                    onClick={onStopGeneration}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-semibold text-xs transition-colors"
                    aria-label="Stop generating response"
                    title="Stop generation (Esc)"
                  >
                    <Square className="w-3.5 h-3.5 fill-rose-400" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitDisabled}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 disabled:shadow-none"
                    aria-label="Send prompt to Enterprise Copilot"
                    title="Send message (Enter)"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CopilotComposer.displayName = 'CopilotComposer';
