import React, { useState } from 'react';
import { CopilotMessage, CopilotCitation } from '../types';
import { CopilotMarkdown } from './CopilotMarkdown';
import { CopilotSuggestedQuestions } from './CopilotSuggestedQuestions';
import { CopilotTypingAnimation } from './CopilotTypingAnimation';

import {
  Shield,
  User,
  Copy,
  Check,
  Edit2,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  Award,
  Cpu,
  Bookmark,
} from 'lucide-react';

export interface CopilotMessageBubbleProps {
  message: CopilotMessage;
  isLatestAssistant?: boolean;
  onCitationClick?: (citation: CopilotCitation) => void;
  onSelectSuggestedQuestion?: (question: string) => void;
  onEditPrompt?: (content: string) => void;
  onRetry?: () => void;
  onRegenerate?: () => void;
}

export const CopilotMessageBubble: React.FC<CopilotMessageBubbleProps> = React.memo(
  ({
    message,
    isLatestAssistant = false,
    onCitationClick,
    onSelectSuggestedQuestion,
    onEditPrompt,
    onRetry,
    onRegenerate,
  }) => {
    const [copied, setCopied] = useState(false);

    const isUser = message.role === 'user';
    const hasContent = Boolean(message.content?.trim());

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard fallback intentionally omitted.
      }
    };

    const handleCitationClick = (index: number) => {
      if (message.citations?.[index]) {
        onCitationClick?.(message.citations[index]);
      }
    };

    const formatTimestamp = (iso?: string) => {
      if (!iso) return '';

      try {
        return new Date(iso).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return '';
      }
    };

    const confidenceScore = message.confidence?.score;

    const confidenceLevel =
      message.confidence?.level ||
      (confidenceScore !== undefined && confidenceScore >= 90
        ? 'HIGH'
        : confidenceScore !== undefined && confidenceScore >= 70
          ? 'MEDIUM'
          : 'LOW');

    return (
      <div
        className={`group flex items-start gap-3 p-4 rounded-xl transition-colors ${
          isUser
            ? 'bg-zinc-900/40 border border-zinc-800/80 ml-auto max-w-[85%]'
            : 'bg-zinc-900/80 border border-zinc-800 mr-auto max-w-full w-full'
        }`}
        role="article"
        aria-label={`${isUser ? 'User' : 'Assistant'} message at ${formatTimestamp(
          message.created_at,
        )}`}
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-md ${
            isUser
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/20'
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-300">
                {isUser ? 'You' : 'Enterprise Copilot'}
              </span>

              <span className="text-[10px] text-zinc-500 font-mono">
                {formatTimestamp(message.created_at)}
              </span>

              {message.isOptimistic && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Sending...
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {isUser && onEditPrompt && (
                <button
                  onClick={() => onEditPrompt(message.content)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                  aria-label="Edit prompt"
                  title="Edit prompt"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                aria-label="Copy response"
                title="Copy response"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {message.error && onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs transition-colors"
                  aria-label="Retry failed request"
                  title="Retry failed request"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}

              {!isUser &&
                isLatestAssistant &&
                !message.isStreaming &&
                onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 text-xs transition-colors"
                    aria-label="Regenerate response"
                    title="Regenerate response"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                )}
            </div>
          </div>

          {/* Error */}
          {message.error ? (
            <div
              className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2"
              role="alert"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />

              <div>
                <p className="font-semibold">Response Error</p>
                <p className="text-rose-200/80 mt-0.5">
                  {message.error}
                </p>
              </div>
            </div>
          ) : message.isStreaming && !hasContent ? (
            /*
             * Important UX:
             * The user gets immediate feedback while Ollama is
             * preparing the first token.
             */
            <div className="py-2">
              <CopilotTypingAnimation label="Analyzing your question..." />
            </div>
          ) : (
            <div className="text-zinc-200">
              <CopilotMarkdown
                content={message.content}
                onCitationClick={handleCitationClick}
              />

              {message.isStreaming && (
                <span
                  className="inline-block w-1.5 h-4 ml-1 bg-indigo-400 rounded-sm align-middle animate-pulse"
                  aria-hidden="true"
                />
              )}
            </div>
          )}

          {/* Metadata */}
          {!isUser && !message.isStreaming && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80">
              {/* Citations */}
              {message.citations && message.citations.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium">
                    <Bookmark className="w-3 h-3 text-indigo-400" />
                    <span>
                      {message.citations.length} Verified Citations
                    </span>
                  </span>

                  <div className="flex items-center gap-1">
                    {message.citations.map((citation, index) => (
                      <button
                        key={`${index}-${citation.document_id}`}
                        onClick={() =>
                          onCitationClick?.(citation)
                        }
                        className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-indigo-600 text-[10px] font-bold text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
                        title={`Citation [${index + 1}]: ${citation.document_title} (Page ${citation.page})`}
                      >
                        [{index + 1}]
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence */}
              {confidenceScore !== undefined && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                    confidenceLevel === 'HIGH'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : confidenceLevel === 'MEDIUM'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  }`}
                  title={`Confidence Level: ${confidenceLevel}`}
                >
                  <Award className="w-3 h-3" />

                  <span>
                    {confidenceScore}% Confidence ({confidenceLevel})
                  </span>
                </span>
              )}

              {/* Usage */}
              {message.usage && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 text-[11px] font-mono"
                  title="Token usage breakdown"
                >
                  <Cpu className="w-3 h-3 text-zinc-500" />

                  <span>
                    Tokens: {message.usage.total_tokens || 0} (
                    {message.usage.prompt_tokens || 0} prompt +{' '}
                    {message.usage.completion_tokens || 0} comp)
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Suggested Questions */}
          {!isUser &&
            !message.isStreaming &&
            message.suggested_questions &&
            message.suggested_questions.length > 0 &&
            onSelectSuggestedQuestion && (
              <CopilotSuggestedQuestions
                questions={message.suggested_questions}
                onSelectQuestion={onSelectSuggestedQuestion}
              />
            )}
        </div>
      </div>
    );
  },
);

CopilotMessageBubble.displayName = 'CopilotMessageBubble';