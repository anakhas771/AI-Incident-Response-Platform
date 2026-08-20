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
      <article
        className={`group ${isUser ? 'ml-auto max-w-[86%]' : 'w-full'} ${
          isUser ? 'rounded-lg border border-zinc-800/70 bg-zinc-900/50 px-4 py-3.5' : ''
        }`}
        aria-label={`${isUser ? 'User' : 'Assistant'} message at ${formatTimestamp(
          message.created_at
        )}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
              isUser
                ? 'border-zinc-800 bg-zinc-900 text-zinc-500'
                : 'border-zinc-800 bg-zinc-900 text-zinc-500'
            }`}
          >
            {isUser ? <User className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-300">
                  {isUser ? 'You' : 'Copilot'}
                </span>
                <span className="text-[10px] text-zinc-600 font-mono">
                  {formatTimestamp(message.created_at)}
                </span>
                {message.isOptimistic && (
                  <span className="text-[10px] text-amber-400">Sending…</span>
                )}
              </div>

              <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                {isUser && onEditPrompt && (
                  <button
                    onClick={() => onEditPrompt(message.content)}
                    className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                    aria-label="Edit prompt"
                    title="Edit prompt"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  onClick={handleCopy}
                  className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                  aria-label="Copy response"
                  title="Copy response"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>

                {message.error && onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-rose-300 transition-colors hover:bg-rose-950/30"
                    aria-label="Retry failed request"
                    title="Retry failed request"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Retry
                  </button>
                )}

                {!isUser && isLatestAssistant && !message.isStreaming && onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                    aria-label="Regenerate response"
                    title="Regenerate response"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Regenerate
                  </button>
                )}
              </div>
            </div>

            <div className={`${isUser ? 'mt-1' : 'mt-2'} text-sm leading-6 text-zinc-200`}>
              {message.error ? (
                <div
                  className="flex items-start gap-2 rounded-md border border-rose-900/60 bg-rose-950/20 px-3 py-2.5 text-xs text-rose-300"
                  role="alert"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <div>
                    <p className="font-semibold">Response error</p>
                    <p className="mt-0.5 text-rose-200/80">{message.error}</p>
                  </div>
                </div>
              ) : message.isStreaming && !hasContent ? (
                <div className="py-1">
                  <CopilotTypingAnimation label="Analyzing your question..." />
                </div>
              ) : (
                <>
                  <CopilotMarkdown
                    content={message.content}
                    onCitationClick={handleCitationClick}
                  />
                  {message.isStreaming && (
                    <span
                      className="ml-1 inline-block h-4 w-1.5 rounded-sm bg-zinc-400 align-middle animate-pulse"
                      aria-hidden="true"
                    />
                  )}
                </>
              )}
            </div>

            {!isUser && !message.isStreaming && (
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-800/70 pt-3 text-[10px] text-zinc-500">
                {message.citations && message.citations.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Bookmark className="h-3 w-3 text-zinc-600" />
                    <span>{message.citations.length} sources</span>
                    {message.citations.map((citation, index) => (
                      <button
                        key={`${index}-${citation.document_id}`}
                        onClick={() => onCitationClick?.(citation)}
                        className="font-mono text-zinc-400 underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-zinc-200"
                        title={`Source [${index + 1}]: ${citation.document_title} (Page ${citation.page})`}
                      >
                        [{index + 1}]
                      </button>
                    ))}
                  </div>
                )}

                {confidenceScore !== undefined && (
                  <span
                    className="flex items-center gap-1 text-zinc-500"
                    title={`Confidence Level: ${confidenceLevel}`}
                  >
                    <Award className="h-3 w-3 text-zinc-600" />
                    {confidenceScore}% confidence
                  </span>
                )}

                {message.usage && (
                  <span className="flex items-center gap-1 font-mono" title="Token usage breakdown">
                    <Cpu className="h-3 w-3 text-zinc-600" />
                    {message.usage.total_tokens || 0} tokens
                  </span>
                )}
              </div>
            )}

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
      </article>
    );
  }
);

CopilotMessageBubble.displayName = 'CopilotMessageBubble';
