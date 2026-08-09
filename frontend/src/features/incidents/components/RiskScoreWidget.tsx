import React from 'react';
import { Activity, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';
import { RiskScoreMetrics } from '../types';

export interface RiskScoreWidgetProps {
  metrics: RiskScoreMetrics | null;
}

export const RiskScoreWidget: React.FC<RiskScoreWidgetProps> = React.memo(({ metrics }) => {
  if (!metrics) {
    return (
      <div className="bg-surface border border-subtle rounded-xl p-5 space-y-2">
        <div className="h-4 bg-zinc-800 rounded animate-pulse w-1/3" />
        <div className="h-10 bg-zinc-900 rounded animate-pulse" />
      </div>
    );
  }

  const colorStyles = {
    red: {
      text: 'text-red-400',
      bg: 'bg-red-950/80',
      border: 'border-red-800',
      bar: 'bg-red-500',
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-950/80',
      border: 'border-amber-800',
      bar: 'bg-amber-500',
    },
    yellow: {
      text: 'text-yellow-400',
      bg: 'bg-yellow-950/80',
      border: 'border-yellow-800',
      bar: 'bg-yellow-500',
    },
    green: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-950/80',
      border: 'border-emerald-800',
      bar: 'bg-emerald-500',
    },
  }[metrics.color_indicator];

  return (
    <div className="bg-surface border border-subtle rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-400" /> Enterprise Risk Exposure
        </h3>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-900/50 px-2 py-0.5 rounded">
          {metrics.ai_confidence}% AI Confidence
        </span>
      </div>

      {/* Main Score Dial */}
      <div
        className={`p-4 rounded-xl border ${colorStyles.bg} ${colorStyles.border} flex items-center justify-between`}
      >
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Risk Assessment Index
          </div>
          <div className={`text-3xl font-black ${colorStyles.text} tracking-tight font-mono`}>
            {metrics.overall_score}
            <span className="text-xs text-zinc-500">/100</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-xs font-mono font-bold">
            {metrics.trend === 'UP' ? (
              <span className="flex items-center text-red-400">
                <TrendingUp className="w-4 h-4 mr-0.5" /> Escalating
              </span>
            ) : metrics.trend === 'DOWN' ? (
              <span className="flex items-center text-emerald-400">
                <TrendingDown className="w-4 h-4 mr-0.5" /> De-escalating
              </span>
            ) : (
              <span className="flex items-center text-yellow-400">
                <Activity className="w-4 h-4 mr-0.5" /> Stable
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-zinc-400 uppercase">
            {metrics.severity} Threat Level
          </span>
        </div>
      </div>

      {/* Multi-Factor Breakdown Bars */}
      <div className="space-y-2.5 pt-1">
        <div className="text-[11px] font-mono text-zinc-400 uppercase">Impact Metric Breakdown</div>
        {metrics.breakdown.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-300">{item.label}</span>
              <span className="text-zinc-400 font-bold">{item.score}%</span>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
              <div
                className={`h-full ${colorStyles.bar} transition-all duration-500`}
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

RiskScoreWidget.displayName = 'RiskScoreWidget';
