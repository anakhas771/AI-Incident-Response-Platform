import React from 'react';
import { RecommendationPriority } from '../../types';

export interface RecommendationBadgeProps {
  priority: RecommendationPriority;
  actionType?: 'AUTOMATE' | 'MANUAL' | 'CONFIG' | 'ESCALATE';
}

export const RecommendationBadge: React.FC<RecommendationBadgeProps> = React.memo(
  ({ priority, actionType }) => {
    const priorityColors: Record<RecommendationPriority, string> = {
      P1: 'bg-red-950/80 border-red-800 text-red-300',
      P2: 'bg-amber-950/80 border-amber-800 text-amber-300',
      P3: 'bg-yellow-950/80 border-yellow-800 text-yellow-300',
      P4: 'bg-zinc-900 border-zinc-800 text-zinc-400',
    };

    const actionColors: Record<string, string> = {
      AUTOMATE: 'bg-indigo-950/80 border-indigo-800 text-indigo-300',
      CONFIG: 'bg-purple-950/80 border-purple-800 text-purple-300',
      MANUAL: 'bg-cyan-950/80 border-cyan-800 text-cyan-300',
      ESCALATE: 'bg-rose-950/80 border-rose-800 text-rose-300',
    };

    return (
      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase">
        <span
          className={`px-2 py-0.5 rounded border ${priorityColors[priority] || priorityColors.P3}`}
        >
          {priority} Priority
        </span>
        {actionType && (
          <span
            className={`px-2 py-0.5 rounded border ${actionColors[actionType] || actionColors.MANUAL}`}
          >
            {actionType}
          </span>
        )}
      </div>
    );
  }
);

RecommendationBadge.displayName = 'RecommendationBadge';
