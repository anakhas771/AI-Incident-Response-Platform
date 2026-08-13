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
        <div className="bg-surface border border-rose-900/30 rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-400" /> Technical Problem Overview
          </h3>
          <p className="text-sm text-rose-300/80 leading-relaxed font-normal">
            Failed to load incident summary: {error}
          </p>
        </div>
      );
    }

    if (isLoading || !incident) {
      return (
        <div className="bg-surface border border-subtle rounded-xl p-5 space-y-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-zinc-800 rounded" />
            <div className="h-4 w-48 bg-zinc-800 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-zinc-800/50 rounded" />
            <div className="h-3 w-5/6 bg-zinc-800/50 rounded" />
            <div className="h-3 w-4/6 bg-zinc-800/50 rounded" />
          </div>
          <div className="h-24 w-full bg-zinc-900 rounded-lg mt-4" />
        </div>
      );
    }

    return (
      <div className="bg-surface border border-subtle rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" /> Technical Problem Overview
        </h3>

        {incident.description ? (
          <p className="text-sm text-zinc-200 leading-relaxed font-normal">
            {incident.description}
          </p>
        ) : (
          <p className="text-sm text-zinc-500 italic">No summary available.</p>
        )}

        {/* Technical Terminal Error Traceback Stream */}
        <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-xs font-mono text-red-300/90 leading-relaxed overflow-x-auto">
          <div className="text-[10px] text-zinc-500 mb-1 flex items-center gap-1.5 border-b border-zinc-900 pb-1">
            <Terminal className="w-3 h-3 text-zinc-500" /> APISERVER_STDERR_STREAM (Cluster Ingress)
          </div>
          <pre>{`[ERROR] 2026-07-29T18:14:02.941Z auth-pod-789a: Failed to acquire DB lock within 5000ms.
[WARN]  Goroutine pool saturated: 1024/1024 active workers.
[FATAL] OOMKilled: Memory limit of 512Mi exceeded on /api/v1/auth/token endpoint.`}</pre>
        </div>
      </div>
    );
  }
);

IncidentSummaryPanel.displayName = 'IncidentSummaryPanel';
