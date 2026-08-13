import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, ShieldCheck } from 'lucide-react';
import { IncidentRecommendation } from '../../types';
import { RecommendationAction } from './RecommendationAction';
import { RecommendationBadge } from './RecommendationBadge';

export interface RecommendationItemProps {
  recommendation: IncidentRecommendation;
}

export const RecommendationItem: React.FC<RecommendationItemProps> = React.memo(
  ({ recommendation }) => {
    const [expanded, setExpanded] = useState(true);

    return (
      <div
        tabIndex={0}
        aria-label={`Recommendation: ${recommendation.title}`}
        className="p-4 rounded-xl bg-surface-elevated border border-subtle hover:border-zinc-700 transition-all space-y-3 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-900/50 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <RecommendationBadge
                  priority={recommendation.priority}
                  actionType={recommendation.action_type}
                />
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                  {recommendation.category}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-900/40 px-2 py-0.5 rounded">
                  {recommendation.confidence}% Confidence
                </span>
              </div>
              <h4 className="text-sm font-bold text-zinc-100">{recommendation.title}</h4>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            aria-label={
              expanded ? 'Collapse recommendation details' : 'Expand recommendation details'
            }
            className="p-1 text-zinc-400 hover:text-zinc-100 rounded transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {expanded && (
          <div className="space-y-3 pt-1 border-t border-subtle/50">
            <p className="text-xs text-zinc-300 leading-relaxed font-normal">
              {recommendation.description}
            </p>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-3 py-1.5 rounded-md">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                <strong>Estimated Impact:</strong> {recommendation.estimated_impact}
              </span>
            </div>

            <RecommendationAction codeSnippet={recommendation.code_snippet} />
          </div>
        )}
      </div>
    );
  }
);

RecommendationItem.displayName = 'RecommendationItem';
