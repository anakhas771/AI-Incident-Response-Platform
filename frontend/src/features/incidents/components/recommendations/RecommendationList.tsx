import React from 'react';
import { Sparkles } from 'lucide-react';
import { IncidentRecommendation } from '../../types';
import { RecommendationItem } from './RecommendationItem';

export interface RecommendationListProps {
  recommendations: IncidentRecommendation[];
  aiStatus?: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  onRetry?: () => void;
}

export const RecommendationList: React.FC<RecommendationListProps> = React.memo(
  ({ recommendations, aiStatus, onRetry }) => {
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
          {aiStatus === 'failed' ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-xs text-rose-400 font-mono italic">
                Failed to generate recommendations.
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
              <Sparkles className="w-6 h-6 text-amber-500/50 mx-auto animate-pulse" />
              <p className="text-xs text-zinc-400 font-mono italic">
                AI Engine is formulating remediation plans...
              </p>
            </div>
          ) : recommendations.length === 0 ? (
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
