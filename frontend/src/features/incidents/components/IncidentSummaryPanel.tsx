import React from 'react';
import { FileText, Terminal } from 'lucide-react';
import { Incident } from '../../../types';

export interface IncidentSummaryPanelProps {
  incident: Incident;
}

export const IncidentSummaryPanel: React.FC<IncidentSummaryPanelProps> = React.memo(
  ({ incident }) => {
    return (
      <div className="bg-surface border border-subtle rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" /> Technical Problem Overview
        </h3>

        <p className="text-sm text-zinc-200 leading-relaxed font-normal">{incident.description}</p>

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
