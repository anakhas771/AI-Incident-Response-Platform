import React, { useEffect } from 'react';
import { CopilotCitation } from '../types';
import { X, FileText, ExternalLink, ShieldCheck, Hash, Layers } from 'lucide-react';

export interface CopilotCitationDrawerProps {
  isOpen: boolean;
  citation: CopilotCitation | null;
  onClose: () => void;
  onOpenDocumentPanel?: (docId: string) => void;
}

/**
 * Enterprise citation inspection drawer sliding in from the right.
 * Shows verified RAG document metadata, similarity score, confidence score, and chunk snippet.
 */
export const CopilotCitationDrawer: React.FC<CopilotCitationDrawerProps> = React.memo(
  ({ isOpen, citation, onClose, onOpenDocumentPanel }) => {
    // Handle Escape key to close modal
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !citation) return null;

    const similarityPct = Math.round((citation.similarity || 0) * 100);
    const confidenceLevel = similarityPct >= 90 ? 'HIGH' : similarityPct >= 75 ? 'MEDIUM' : 'LOW';

    return (
      <div
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Verified Source Citation Drawer"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Verified Citation</h3>
              <p className="text-[10px] text-zinc-400">RAG Semantic Search Match</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            aria-label="Close citation drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Document Title & Open Panel Button */}
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
                <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="line-clamp-2">
                  {citation.document_title || 'Untitled Document'}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono text-xs border border-zinc-700/60">
                <Hash className="w-3 h-3 text-zinc-400" />
                <span>Page {citation.page}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono text-xs border border-zinc-700/60">
                <Layers className="w-3 h-3 text-zinc-400" />
                <span>Chunk #{citation.chunk_index}</span>
              </span>
            </div>
          </div>

          {/* Scores Panel: Similarity Score & Confidence Score */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
              <div className="text-[11px] font-medium text-zinc-400 mb-1">Similarity Score</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-indigo-400">
                  {similarityPct}%
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  ({citation.similarity.toFixed(2)})
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all"
                  style={{ width: `${similarityPct}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
              <div className="text-[11px] font-medium text-zinc-400 mb-1">Confidence Score</div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                    confidenceLevel === 'HIGH'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : confidenceLevel === 'MEDIUM'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {confidenceLevel}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">Semantic grounding verified</p>
            </div>
          </div>

          {/* Snippet Card */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Retrieved Chunk Content
            </h4>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300 leading-relaxed max-h-80 overflow-y-auto">
              {citation.snippet || 'No excerpt available for this chunk.'}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-zinc-900/80 border-t border-zinc-800">
          <button
            onClick={() => onOpenDocumentPanel?.(citation.document_id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20"
          >
            <span>Open Document Panel</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
);

CopilotCitationDrawer.displayName = 'CopilotCitationDrawer';
