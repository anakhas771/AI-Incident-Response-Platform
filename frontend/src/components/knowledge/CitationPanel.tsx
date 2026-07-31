import React from 'react';
import { BookOpen, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
import { Citation } from '../../types/knowledge';
import { SimilarityCard } from './SimilarityCard';

interface CitationPanelProps {
  citations: Citation[];
  onSelectCitation?: (citation: Citation) => void;
}

export const CitationPanel: React.FC<CitationPanelProps> = ({ citations, onSelectCitation }) => {
  if (!citations || citations.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center text-xs text-slate-500">
        No specific knowledge base citations available for this response.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <BookOpen className="h-4 w-4 text-cyan-400" />
          <span>Grounded Source Citations ({citations.length})</span>
        </h4>
        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Verified RAG Evidence
        </span>
      </div>

      <div className="grid gap-2.5">
        {citations.map((citation, idx) => (
          <div
            key={`${citation.document_id}-${idx}`}
            onClick={() => onSelectCitation && onSelectCitation(citation)}
            className="group relative cursor-pointer rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 transition-all hover:border-cyan-500/50 hover:bg-slate-900 hover:shadow-lg hover:shadow-cyan-500/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-cyan-400 group-hover:bg-cyan-500/20">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-200 group-hover:text-cyan-400">
                    {citation.document}
                  </h5>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Page {citation.page}</span>
                    <span>•</span>
                    <span>Chunk #{citation.chunk}</span>
                  </div>
                </div>
              </div>

              <SimilarityCard score={citation.similarity} size="sm" />
            </div>

            <p className="mt-2.5 rounded-lg bg-slate-950/70 p-2.5 font-mono text-xs leading-relaxed text-slate-300 border border-slate-800/80">
              &ldquo;{citation.snippet}&rdquo;
            </p>

            {onSelectCitation && (
              <div className="mt-2 flex items-center justify-end gap-1 text-[11px] font-medium text-cyan-400 opacity-0 transition-opacity group-hover:opacity-100">
                <span>View Full Document</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
