import React, { useState } from 'react';
import {
  Bot,
  User as UserIcon,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  FileText,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Download,
  Printer,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { ChatMessage, Citation } from '../../types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TokenUsageBadge } from './TokenUsageBadge';
import { SuggestedQuestions } from './SuggestedQuestions';
import { TypingAnimation } from './TypingAnimation';
import toast from 'react-hot-toast';

export interface MessageBubbleProps {
  message: ChatMessage;
  onRegenerate?: () => void;
  onSelectSuggestedQuestion?: (question: string) => void;
  onOpenCitation?: (citation: Citation) => void;
  onLikeToggle?: (messageId: string, liked: boolean | null) => void;
  isLastAssistant?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onRegenerate,
  onSelectSuggestedQuestion,
  onOpenCitation,
  onLikeToggle,
  isLastAssistant = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [citationsOpen, setCitationsOpen] = useState(false);
  const [selectedCitationIndex, setSelectedCitationIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Message text copied to clipboard', {
      style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    const isLiked = feedback === 'like';
    const nextState = isLiked ? null : 'like';
    setFeedback(nextState);
    onLikeToggle?.(message.id, isLiked ? null : true);
    if (!isLiked) {
      toast.success('Thank you! Feedback recorded.', {
        style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
      });
    }
  };

  const handleDislike = () => {
    const isDisliked = feedback === 'dislike';
    const nextState = isDisliked ? null : 'dislike';
    setFeedback(nextState);
    onLikeToggle?.(message.id, isDisliked ? null : false);
    if (!isDisliked) {
      toast.success('Feedback recorded. Our team will review this output.', {
        style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
      });
    }
  };

  const handleExportMarkdown = () => {
    const mdContent =
      `# AI Copilot Security Investigation Report\n` +
      `**Generated:** ${new Date().toISOString()}\n` +
      `**Model:** ${message.usage?.model || 'GPT-4o-Security'}\n\n` +
      `---\n\n` +
      `${message.content}\n\n` +
      (message.citations && message.citations.length > 0
        ? `### Verified Sources & Citations\n` +
          message.citations
            .map((c, i) => `[${i + 1}] ${c.document_title} (ID: ${c.document_id}, Page: ${c.page})`)
            .join('\n')
        : '');

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `copilot-response-${message.id.slice(0, 8)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Exported markdown file', {
      style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
    });
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow popups to export PDF.');
      return;
    }

    const citationsHTML =
      message.citations && message.citations.length > 0
        ? `<h3>Verified Sources & Citations</h3><ul>` +
          message.citations
            .map(
              (c, i) =>
                `<li><strong>[${i + 1}] ${c.document_title}</strong> (ID: ${c.document_id}, Page: ${c.page}) - ${Math.round(
                  (c.similarity || 0) * 100
                )}% Match</li>`
            )
            .join('') +
          `</ul>`
        : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SOC Copilot Response Export</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; }
            h1 { font-size: 20px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; }
            pre { background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 12px; }
            code { font-family: monospace; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; }
            .content { margin-top: 20px; }
            .citations { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>Enterprise AI Incident Response Report</h1>
          <div class="meta">
            <strong>ID:</strong> ${message.id} | <strong>Generated:</strong> ${new Date(message.created_at).toLocaleString()} | <strong>Model:</strong> ${message.usage?.model || 'GPT-4o'}
          </div>
          <div class="content">
            ${message.content.replace(/\n/g, '<br/>')}
          </div>
          <div class="citations">
            ${citationsHTML}
          </div>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formattedTime = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const renderConfidenceBadge = () => {
    if (!message.confidence) return null;

    const { level, score } = message.confidence;
    const isHigh = level === 'HIGH';
    const isMed = level === 'MEDIUM';

    const bgClass = isHigh
      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
      : isMed
        ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
        : 'bg-rose-950/60 border-rose-500/40 text-rose-300';

    const Icon = isHigh ? ShieldCheck : ShieldAlert;

    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-mono ${bgClass}`}
        title={message.confidence.reasons?.join(', ') || `Confidence: ${score}%`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>
          {level}: {score}%
        </span>
      </div>
    );
  };

  const renderCitationsAccordion = () => {
    if (!message.citations || message.citations.length === 0) return null;

    return (
      <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/80 overflow-hidden">
        <button
          onClick={() => setCitationsOpen(!citationsOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border-b border-zinc-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Verified Sources & Citations ({message.citations.length})</span>
          </div>
          {citationsOpen ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {citationsOpen && (
          <div className="p-3 space-y-2.5 divide-y divide-zinc-900">
            {message.citations.map((citation, idx) => {
              const isHighlighted = selectedCitationIndex === idx;
              return (
                <div
                  key={idx}
                  className={`pt-2.5 first:pt-0 ${
                    isHighlighted ? 'bg-indigo-950/30 -mx-3 px-3 py-2 rounded' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      onClick={() => onOpenCitation?.(citation)}
                      className="font-semibold text-indigo-300 hover:text-indigo-200 cursor-pointer inline-flex items-center gap-1"
                      title="Inspect source details in drawer"
                    >
                      [{idx + 1}] {citation.document_title}
                      <ExternalLink className="w-3 h-3 text-indigo-400" />
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                      p.{citation.page} ({(citation.similarity * 100).toFixed(0)}% match)
                    </span>
                  </div>
                  {citation.snippet && (
                    <p
                      onClick={() => onOpenCitation?.(citation)}
                      className="mt-1 text-xs text-zinc-400 italic bg-zinc-900/60 p-2 rounded border border-zinc-800/60 hover:border-indigo-500/40 cursor-pointer transition-colors"
                    >
                      &ldquo;{citation.snippet}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`flex gap-4 p-4 md:p-5 rounded-2xl transition-colors ${
        isUser
          ? 'bg-zinc-900/40 border border-zinc-800/60 ml-8 md:ml-16'
          : 'bg-zinc-900/80 border border-zinc-800/90 mr-4 md:mr-12 shadow-md'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {isUser ? (
          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shadow-sm">
            <UserIcon className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Main message area */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isUser ? 'text-zinc-300' : 'text-indigo-400'
              }`}
            >
              {isUser ? 'Operator' : 'SOC Security Agent'}
            </span>
            {isAssistant && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                GPT-4o
              </span>
            )}
            {formattedTime && (
              <span className="text-[11px] font-mono text-zinc-500">{formattedTime}</span>
            )}
            {isAssistant && message.usage?.latency_ms && (
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500"
                title="Response synthesis latency"
              >
                <Clock className="w-3 h-3 text-zinc-500" />
                {message.usage.latency_ms}ms
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {isAssistant && renderConfidenceBadge()}

            {/* Like/Dislike Feedback Buttons */}
            {isAssistant && (
              <>
                <button
                  onClick={handleLike}
                  className={`p-1.5 rounded transition-colors ${
                    feedback === 'like'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Helpful response"
                  aria-label="Like response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDislike}
                  className={`p-1.5 rounded transition-colors ${
                    feedback === 'dislike'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Unhelpful response"
                  aria-label="Dislike response"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Export Markdown (.md) */}
            {isAssistant && message.content && (
              <button
                onClick={handleExportMarkdown}
                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Export as Markdown (.md)"
                aria-label="Export as Markdown"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Export PDF / Print */}
            {isAssistant && message.content && (
              <button
                onClick={handleExportPDF}
                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Export as PDF / Print"
                aria-label="Export as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Copy message"
              aria-label="Copy message"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Regenerate button */}
            {isAssistant && isLastAssistant && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Regenerate response"
                aria-label="Regenerate response"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Error banner if any */}
        {message.error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              <strong>Stream Error:</strong> {message.error}
            </span>
          </div>
        )}

        {/* Content body */}
        {message.isStreaming && !message.content ? (
          <TypingAnimation label="AI Security Engine retrieving security context & synthesizing logs..." />
        ) : (
          <div className="text-zinc-200">
            <MarkdownRenderer
              content={message.content}
              onCitationClick={(idx) => {
                setCitationsOpen(true);
                setSelectedCitationIndex(idx);
                if (message.citations && message.citations[idx]) {
                  onOpenCitation?.(message.citations[idx]);
                }
              }}
            />
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 rounded-sm animate-pulse align-middle" />
            )}
          </div>
        )}

        {/* Citations section */}
        {isAssistant && renderCitationsAccordion()}

        {/* Token usage metrics badge */}
        {isAssistant && message.usage && <TokenUsageBadge usage={message.usage} />}

        {/* Suggested follow-up questions chips */}
        {isAssistant && isLastAssistant && onSelectSuggestedQuestion && (
          <SuggestedQuestions
            questions={message.suggested_questions || []}
            onSelectQuestion={onSelectSuggestedQuestion}
          />
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
