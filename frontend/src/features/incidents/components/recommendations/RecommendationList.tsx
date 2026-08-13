import React from 'react';
import { Sparkles } from 'lucide-react';
import { IncidentRecommendation } from '../../types';
import { RecommendationItem } from './RecommendationItem';

export interface RecommendationListProps {
  recommendations: IncidentRecommendation[];
}

export const RecommendationList: React.FC<RecommendationListProps> = React.memo(
  ({ recommendations }) => {
    return (
      <div className="bg-surface border border-subtle rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-subtle">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              AI Actionable Remediation Plans ({recommendations.length})
            </h3>
          </div>
        </div>

        <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {recommendations.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono italic">
              No recommendations generated for this incident yet.
            </div>
          ) : (
            recommendations.map((rec) => <RecommendationItem key={rec.id} recommendation={rec} />)
          )}
        </div>
      </div>
    );
  }
);

RecommendationList.displayName = 'RecommendationList';
