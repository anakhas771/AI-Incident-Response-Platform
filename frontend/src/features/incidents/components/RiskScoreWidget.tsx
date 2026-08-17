import React from 'react';
import { Activity, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';
import { RiskScoreMetrics } from '../types';

export interface RiskScoreWidgetProps {
  metrics: RiskScoreMetrics | null;
}

export const RiskScoreWidget: React.FC<RiskScoreWidgetProps> = React.memo(({ metrics }) => {
  if (!metrics) {
    return (
      <section className="border-y border-subtle py-5 animate-pulse">
        <div className="h-3 w-36 rounded bg-zinc-800" />
        <div className="mt-4 h-10 w-24 rounded bg-zinc-900" />
      </section>
    );
  }

  const colorStyles = {
    red: {
      text: 'text-red-400',
      bar: 'bg-red-400',
      label: 'High exposure',
    },
    amber: {
      text: 'text-amber-400',
      bar: 'bg-amber-400',
      label: 'Elevated exposure',
    },
    yellow: {
      text: 'text-yellow-400',
      bar: 'bg-yellow-400',
      label: 'Moderate exposure',
    },
    green: {
      text: 'text-emerald-400',
      bar: 'bg-emerald-400',
      label: 'Controlled exposure',
    },
  }[metrics.color_indicator];

  const TrendIcon =
    metrics.trend === 'UP' ? TrendingUp : metrics.trend === 'DOWN' ? TrendingDown : Activity;

  return (
    <section className="border-y border-subtle py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-zinc-500" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Risk assessment
            </p>
          </div>
          <p className="mt-2 text-xs text-zinc-500">Current exposure across affected systems</p>
        </div>
        <span className="text-[10px] font-mono text-zinc-600">
          {metrics.ai_confidence}% confidence
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <div className={`font-mono text-4xl font-semibold tracking-tight ${colorStyles.text}`}>
            {metrics.overall_score}
            <span className="ml-1 text-sm font-normal text-zinc-600">/100</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">{colorStyles.label}</p>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-zinc-300">
            <TrendIcon
              className={`h-3.5 w-3.5 ${metrics.trend === 'UP' ? 'text-red-400' : metrics.trend === 'DOWN' ? 'text-emerald-400' : 'text-zinc-500'}`}
            />
            {metrics.trend === 'UP'
              ? 'Escalating'
              : metrics.trend === 'DOWN'
                ? 'De-escalating'
                : 'Stable'}
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-zinc-600">
            {metrics.severity} threat level
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Exposure factors</p>
        {metrics.breakdown.map((item, idx) => (
          <div key={idx}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-zinc-400">{item.label}</span>
              <span className="font-mono text-zinc-500">{item.score}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-zinc-900">
              <div
                className={`h-full ${colorStyles.bar} transition-all duration-500`}
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

RiskScoreWidget.displayName = 'RiskScoreWidget';
