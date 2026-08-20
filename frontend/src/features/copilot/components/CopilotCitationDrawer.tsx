import React, { useEffect } from 'react';
import { CopilotCitation } from '../types';
import { X, FileText, ExternalLink, ShieldCheck, Hash, Layers } from 'lucide-react';

export interface CopilotCitationDrawerProps {
  isOpen: boolean;
  citation: CopilotCitation | null;
  onClose: () => void;
  onOpenDocumentPanel?: (docId: string) => void;
}

export const CopilotCitationDrawer: React.FC<CopilotCitationDrawerProps> = React.memo(
  ({ isOpen, citation, onClose, onOpenDocumentPanel }) => {
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !citation) return null;

    const similarityPct = Math.round((citation.similarity || 0) * 100);
    const confidenceLevel = similarityPct >= 90 ? 'HIGH' : similarityPct >= 75 ? 'MEDIUM' : 'LOW';

    return (
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-zinc-800/80 bg-zinc-950 shadow-2xl sm:w-96"
        role="dialog"
        aria-modal="true"
        aria-label="Verified Source Citation Drawer"
      >
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-zinc-500" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                Source
              </p>
              <h3 className="mt-1 text-sm font-semibold text-zinc-100">Evidence inspector</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
            aria-label="Close citation drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div>
            <div className="flex items-start gap-2.5">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
              <div className="min-w-0">
                <h4 className="text-sm font-medium leading-5 text-zinc-100">
                  {citation.document_title || 'Untitled Document'}
                </h4>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-mono text-zinc-600">
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Page {citation.page}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    Chunk {citation.chunk_index}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-y border-zinc-800/80 py-4">
            <div className="pr-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Similarity</p>
              <p className="mt-1 text-xl font-semibold font-mono text-zinc-100">{similarityPct}%</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-full bg-zinc-500 transition-all"
                  style={{ width: `${similarityPct}%` }}
                />
              </div>
            </div>
            <div className="border-l border-zinc-800/80 pl-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Confidence</p>
              <p className="mt-1 text-sm font-semibold text-zinc-200">{confidenceLevel}</p>
              <p className="mt-1 text-[10px] text-zinc-600">Semantic match</p>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
              Retrieved excerpt
            </h4>
            <blockquote className="mt-3 border-l border-zinc-700 pl-4 font-mono text-xs leading-6 text-zinc-400">
              {citation.snippet || 'No excerpt available for this source.'}
            </blockquote>
          </div>
        </div>

        <div className="border-t border-zinc-800/80 p-4">
          <button
            onClick={() => onOpenDocumentPanel?.(citation.document_id)}
            className="flex w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/70 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <span>Open source document</span>
            <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
          </button>
        </div>
      </div>
    );
  }
);

CopilotCitationDrawer.displayName = 'CopilotCitationDrawer';
