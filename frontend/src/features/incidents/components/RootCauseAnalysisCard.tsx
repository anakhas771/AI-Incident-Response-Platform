import React, { useState } from 'react';
import { AlertCircle, Brain, Check, Copy, Cpu, ShieldCheck, Terminal } from 'lucide-react';
import { IncidentRCA } from '../types';
import toast from 'react-hot-toast';

export interface RootCauseAnalysisCardProps {
  rca: IncidentRCA | null;
  aiStatus?: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  onRetry?: () => void;
}

export const RootCauseAnalysisCard: React.FC<RootCauseAnalysisCardProps> = React.memo(
  ({ rca, aiStatus, onRetry }) => {
    const [copied, setCopied] = useState(false);

    if (aiStatus === 'failed') {
      return (
        <div className="rounded-xl border border-rose-900/30 bg-surface p-6 sm:p-8 text-center space-y-4">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-rose-400">AI Analysis Failed</h3>
            <p className="text-xs text-zinc-400">
              The AI Engine could not complete the Root Cause Analysis for this incident.
            </p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-md bg-rose-950 px-4 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-900"
            >
              Retry Analysis
            </button>
          )}
        </div>
      );
    }

    if (!rca || aiStatus === 'pending' || aiStatus === 'processing') {
      return (
        <div className="rounded-xl border border-subtle bg-surface p-6 sm:p-8 text-center space-y-3">
          <Brain className="mx-auto h-8 w-8 animate-pulse text-cyan-500/50" />
          <p className="text-xs text-zinc-400">AI Engine is generating Root Cause Analysis...</p>
        </div>
      );
    }

    const handleCopyPatch = () => {
      if (!rca.suggested_code_fix) return;
      navigator.clipboard.writeText(rca.suggested_code_fix);
      setCopied(true);
      toast.success('RCA Code Fix copied to clipboard', {
        style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
      });
      setTimeout(() => setCopied(false), 2000);
    };

    const hasConfidence = Number(rca.confidence) > 0;
    const factors = rca.contributing_factors.filter(Boolean);
    const systems = rca.affected_systems.filter(Boolean);
    const remediations = rca.recommended_remediation.filter(Boolean);

    return (
      <div className="rounded-xl border border-cyan-900/40 bg-surface p-4 sm:p-5 lg:p-6 shadow-sm space-y-5">
        <div className="flex flex-col gap-3 border-b border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-800 bg-cyan-950/80 text-cyan-400">
              <Brain className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-200">
                Autonomous Root Cause Analysis
              </h3>
              <p className="text-[10px] font-mono text-zinc-500">
                Generated at {new Date(rca.generated_at).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <span className="self-start rounded-md border border-cyan-800 bg-cyan-950/80 px-2.5 py-1 text-[10px] font-mono font-bold text-cyan-300 sm:self-auto">
            {hasConfidence ? `${rca.confidence}% Confidence Match` : 'Confidence not reported'}
          </span>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Executive Hypothesis</h4>
          <p className="break-words rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3 text-xs font-medium leading-relaxed text-zinc-200 sm:p-4">
            {rca.summary}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" /> Contributing Factors
            </h4>
            {factors.length ? (
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {factors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2 rounded-md border border-subtle bg-surface-elevated/40 p-2.5">
                    <span className="font-mono font-bold text-amber-400">•</span>
                    <span className="break-words leading-snug">{factor}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-md border border-subtle p-3 text-xs text-zinc-500">No additional contributing factors were returned.</p>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <Cpu className="h-3.5 w-3.5 text-red-400" /> Affected Systems
            </h4>
            {systems.length ? (
              <div className="flex flex-wrap gap-1.5">
                {systems.map((sys, idx) => (
                  <span key={idx} className="max-w-full break-words rounded border border-red-900/50 bg-red-950/40 px-2.5 py-1 text-[11px] font-mono text-red-300">
                    {sys}
                  </span>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-subtle p-3 text-xs text-zinc-500">No affected systems were returned by the analysis.</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">AI Evidence & Log Correlation</h4>
          <p className="break-words rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-xs leading-relaxed text-zinc-300 sm:p-4">
            {rca.ai_explanation}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Immediate Mitigation Checklist
          </h4>
          {remediations.length ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {remediations.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-md border border-emerald-900/40 bg-emerald-950/30 p-2.5 text-xs text-emerald-300">
                  <span className="shrink-0 font-bold text-emerald-400">{idx + 1}.</span>
                  <span className="break-words leading-snug">{step}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-subtle p-3 text-xs text-zinc-500">No mitigation actions were returned.</p>
          )}
        </div>

        {rca.suggested_code_fix && (
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                <Terminal className="h-3.5 w-3.5 text-indigo-400" /> Suggested Patch
              </h4>
              <button
                onClick={handleCopyPatch}
                aria-label="Copy suggested RCA fix patch"
                className="inline-flex w-fit items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] font-mono text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy Patch'}</span>
              </button>
            </div>
            <div className="max-h-80 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs font-mono leading-relaxed text-emerald-400/90">
              <pre className="whitespace-pre-wrap break-words">{rca.suggested_code_fix}</pre>
            </div>
          </div>
        )}
      </div>
    );
  }
);

RootCauseAnalysisCard.displayName = 'RootCauseAnalysisCard';
