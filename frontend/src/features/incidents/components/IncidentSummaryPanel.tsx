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
        <section className="rounded-xl border border-rose-500/20 bg-rose-500/[0.05] p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-400">
            Incident summary unavailable
          </p>
          <p className="mt-2 text-sm leading-6 text-rose-200/80">{error}</p>
        </section>
      );
    }

    if (isLoading || !incident) {
      return (
        <section className="rounded-xl border border-subtle p-4 sm:p-5 animate-pulse">
          <div className="h-3 w-40 rounded bg-zinc-800" />
          <div className="mt-4 h-4 w-full rounded bg-zinc-800/70" />
          <div className="mt-2 h-4 w-5/6 rounded bg-zinc-800/70" />
          <div className="mt-5 h-20 w-full rounded-lg bg-zinc-900" />
        </section>
      );
    }

    const events = Array.isArray(incident.events) ? incident.events : [];
    const evidence = events
      .slice(-8)
      .map((event) => {
        const timestamp = event.created_at
          ? new Date(event.created_at).toISOString()
          : '';
        return `[${timestamp}] ${event.event_type}: ${event.message}`;
      })
      .filter(Boolean)
      .join('\n');

    return (
      <section className="rounded-xl border border-subtle bg-surface/60 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-zinc-500" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Problem statement
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
            Live incident data
          </span>
        </div>

        {incident.description ? (
          <p className="mt-4 max-w-4xl break-words text-sm leading-7 text-zinc-200">
            {incident.description}
          </p>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">
            No primary description was recorded. Analysis is grounded in the incident timeline evidence below.
          </p>
        )}

        {evidence && (
          <div className="mt-5 overflow-hidden rounded-xl border border-subtle bg-black/20">
            <div className="flex flex-col gap-2 border-b border-subtle px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-zinc-500" />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Timeline evidence
                </span>
              </div>
              <span className="font-mono text-[10px] text-zinc-600">
                {events.length} recorded event{events.length === 1 ? '' : 's'}
              </span>
            </div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words px-4 py-3 font-mono text-[11px] leading-5 text-zinc-400">
              {evidence}
            </pre>
          </div>
        )}
      </section>
    );
  }
);

IncidentSummaryPanel.displayName = 'IncidentSummaryPanel';
