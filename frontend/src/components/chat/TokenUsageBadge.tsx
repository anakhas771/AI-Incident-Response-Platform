import React from 'react';
import { Cpu, DollarSign, Clock } from 'lucide-react';
import { ChatUsage } from '../../types/chat';

export interface TokenUsageBadgeProps {
  usage?: ChatUsage;
}

export const TokenUsageBadge: React.FC<TokenUsageBadgeProps> = ({ usage }) => {
  if (!usage) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-[11px] font-mono text-zinc-400">
      <div className="flex items-center gap-1">
        <Cpu className="w-3 h-3 text-indigo-400" />
        <span>
          <strong className="text-zinc-300">{usage.total_tokens.toLocaleString()}</strong> tokens
          {usage.prompt_tokens > 0 && (
            <span className="text-zinc-500">
              {' '}
              ({usage.prompt_tokens} prompt / {usage.completion_tokens} comp)
            </span>
          )}
        </span>
      </div>

      {typeof usage.estimated_cost === 'number' && (
        <div className="flex items-center gap-1 border-l border-zinc-800 pl-3">
          <DollarSign className="w-3 h-3 text-emerald-400" />
          <span>
            Cost: <strong className="text-zinc-300">${usage.estimated_cost.toFixed(5)}</strong>
          </span>
        </div>
      )}

      {typeof usage.latency_ms === 'number' && (
        <div className="flex items-center gap-1 border-l border-zinc-800 pl-3">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>
            <strong className="text-zinc-300">{usage.latency_ms}</strong> ms
          </span>
        </div>
      )}

      {usage.model && (
        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase text-[9px]">
          {usage.model}
        </span>
      )}
    </div>
  );
};
