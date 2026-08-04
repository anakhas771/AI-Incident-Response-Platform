import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  Percent,
  FileCode,
} from 'lucide-react';
import { Citation } from '../../types/chat';

export interface SourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  citation: Citation | null;
  onOpenDocument?: (docId: string) => void;
}

export const SourceDrawer: React.FC<SourceDrawerProps> = ({
  isOpen,
  onClose,
  citation,
  onOpenDocument,
}) => {
  const [copied, setCopied] = useState(false);

  if (!citation) return null;

  const similarityPercent = Math.round((citation.similarity || 0) * 100);

  const getSimilarityColor = (pct: number) => {
    if (pct >= 85)
      return { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    if (pct >= 70)
      return { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' };
    return { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30' };
  };

  const simColor = getSimilarityColor(similarityPercent);

  const handleCopySnippet = () => {
    if (!citation.snippet) return;
    navigator.clipboard.writeText(citation.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col"
            role="dialog"
            aria-label="Verified source preview drawer"
            aria-modal="true"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 line-clamp-1">
                    {citation.document_title || citation.document_id}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">ID: {citation.document_id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                aria-label="Close source drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Similarity Match Card */}
              <div className={`p-4 rounded-xl border ${simColor.border} bg-zinc-950/50 space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className={`w-4 h-4 ${simColor.text}`} />
                    <span className="text-xs font-medium text-zinc-300">
                      Vector Similarity Score
                    </span>
                  </div>
                  <span
                    className={`text-sm font-bold font-mono px-2 py-0.5 rounded bg-zinc-900 ${simColor.text}`}
                  >
                    {similarityPercent}% Match
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${simColor.bg}`}
                    style={{ width: `${Math.min(100, Math.max(0, similarityPercent))}%` }}
                  />
                </div>
              </div>

              {/* Document Metadata Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/80">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">
                    Page Reference
                  </span>
                  <span className="text-sm font-semibold text-zinc-200 font-mono">
                    {citation.page !== undefined ? `Page ${citation.page}` : 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/80">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">
                    Chunk Index
                  </span>
                  <span className="text-sm font-semibold text-zinc-200 font-mono">
                    {citation.chunk_index !== undefined ? `#${citation.chunk_index}` : '0'}
                  </span>
                </div>
              </div>

              {/* Highlighted Snippet Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Highlighted Source Snippet
                    </h4>
                  </div>
                  <button
                    onClick={handleCopySnippet}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
                    aria-label="Copy snippet text"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200 leading-relaxed overflow-y-auto max-h-72 whitespace-pre-wrap selection:bg-indigo-500/30">
                  <div className="pl-3 border-l-2 border-indigo-500">
                    {citation.snippet ||
                      'No text snippet preview available for this citation chunk.'}
                  </div>
                </div>
              </div>

              {/* Security Advisory / Trust Banner */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-950/20 border border-indigo-800/30 text-xs text-indigo-300">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                <div>
                  <span className="font-semibold block text-indigo-200">SOC Verified Citation</span>
                  This snippet was dynamically retrieved from enterprise knowledge vector indices
                  and ranked by hybrid semantic similarity.
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Close Drawer
              </button>
              {onOpenDocument && (
                <button
                  onClick={() => onOpenDocument(citation.document_id)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Full Document</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SourceDrawer;
