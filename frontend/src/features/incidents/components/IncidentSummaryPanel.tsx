import React from 'react';
import { FileText, Terminal } from 'lucide-react';
import { Incident } from '../../../types';

export interface IncidentSummaryPanelProps {
  incident: Incident | null;
  isLoading?: boolean;
  error?: string | null;
}

export const IncidentSummaryPanel: React.FC<IncidentSummaryPanelProps> = React.memo(
  ({ incident, isLoading, error }) => {
    if (error) {
      return (
        <section className="border-l-2 border-rose-500/60 bg-surface px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-rose-400">
            Incident summary unavailable
          </p>
          <p className="mt-2 text-sm leading-6 text-rose-200/80">{error}</p>
        </section>
      );
    }

    if (isLoading || !incident) {
      return (
        <section className="border-y border-subtle py-5 animate-pulse">
          <div className="h-3 w-40 rounded bg-zinc-800" />
          <div className="mt-4 h-4 w-full rounded bg-zinc-800/70" />
          <div className="mt-2 h-4 w-5/6 rounded bg-zinc-800/70" />
          <div className="mt-5 h-24 w-full rounded-lg bg-zinc-900" />
        </section>
      );
    }

    return (
      <section className="border-y border-subtle py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-zinc-500" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Problem statement
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
            Primary evidence
          </span>
        </div>

        {incident.description ? (
          <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-200">{incident.description}</p>
        ) : (
          <p className="mt-4 text-sm italic text-zinc-500">No incident summary is available.</p>
        )}

        <div className="mt-5 overflow-hidden rounded-lg border border-subtle bg-black/20">
          <div className="flex items-center justify-between border-b border-subtle px-3 py-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-zinc-500" />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Evidence excerpt
              </span>
            </div>
            <span className="font-mono text-[10px] text-zinc-600">stderr / ingress</span>
          </div>
          <pre className="overflow-x-auto px-4 py-3 font-mono text-[11px] leading-5 text-zinc-400">
            {`[ERROR] 2026-07-29T18:14:02.941Z auth-pod-789a: Failed to acquire DB lock within 5000ms.
[WARN]  Goroutine pool saturated: 1024/1024 active workers.
[FATAL] OOMKilled: Memory limit of 512Mi exceeded on /api/v1/auth/token endpoint.`}
          </pre>
        </div>
      </section>
    );
  }
);

IncidentSummaryPanel.displayName = 'IncidentSummaryPanel';
