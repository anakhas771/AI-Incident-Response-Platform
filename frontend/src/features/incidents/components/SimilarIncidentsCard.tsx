import React from 'react';
import { ExternalLink, Layers } from 'lucide-react';
import { SimilarIncidentCard } from '../types';
import { SeverityBadge, StatusBadge } from '../../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

export interface SimilarIncidentsCardProps {
  similarIncidents: SimilarIncidentCard[];
  onSelectIncident?: (id: string) => void;
  aiStatus?: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  onRetry?: () => void;
}

export const SimilarIncidentsCard: React.FC<SimilarIncidentsCardProps> = React.memo(
  ({ similarIncidents, onSelectIncident, aiStatus, onRetry }) => {
    const navigate = useNavigate();

    const handleClick = (id: string) => {
      if (onSelectIncident) {
        onSelectIncident(id);
      } else {
        navigate(`/incidents/${id}`);
      }
    };

    return (
      <div className="bg-surface border border-subtle rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-subtle">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Correlated Historical Incidents ({similarIncidents.length})
            </h3>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {aiStatus === 'failed' ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-xs text-rose-400 font-mono italic">
                Failed to find similar incidents.
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 rounded text-xs transition-colors"
                >
                  Retry Analysis
                </button>
              )}
            </div>
          ) : aiStatus === 'pending' || aiStatus === 'processing' ? (
            <div className="py-8 text-center space-y-3">
              <Layers className="w-6 h-6 text-purple-500/50 mx-auto animate-pulse" />
              <p className="text-xs text-zinc-400 font-mono italic">
                AI Engine is searching historical incidents...
              </p>
            </div>
          ) : similarIncidents.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono italic">
              No matching historical incidents found.
            </div>
          ) : (
            similarIncidents.map((item) => (
              <div
                key={item.id}
                tabIndex={0}
                role="button"
                onClick={() => handleClick(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick(item.id);
                  }
                }}
                aria-label={`View similar incident: ${item.title}`}
                className="group p-4 rounded-xl bg-surface-elevated border border-subtle hover:border-purple-600/50 hover:bg-surface-elevated/80 transition-all cursor-pointer space-y-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                      {item.id}
                    </span>
                    <SeverityBadge severity={item.severity} />
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-mono font-bold text-purple-400 bg-purple-950/60 border border-purple-800 px-2 py-0.5 rounded">
                      {item.similarity_score}% Match
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                  </div>
                </div>

                <h4 className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 transition-colors">
                  {item.title}
                </h4>

                {item.root_cause_summary && (
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.root_cause_summary}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-subtle/40">
                  <span>
                    Resolved in:{' '}
                    <strong className="text-zinc-300">{item.resolved_in_mins} mins</strong>
                  </span>
                  <span>Click to load context</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
);

SimilarIncidentsCard.displayName = 'SimilarIncidentsCard';
