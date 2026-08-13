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
        <div className="bg-surface border border-rose-900/30 rounded-xl p-8 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-rose-400">AI Analysis Failed</h3>
            <p className="text-xs text-zinc-400 font-mono">
              The AI Engine encountered an error while generating the Root Cause Analysis.
            </p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-rose-950 text-rose-300 hover:bg-rose-900 rounded-md text-xs font-semibold transition-colors"
            >
              Retry Analysis
            </button>
          )}
        </div>
      );
    }

    if (!rca || aiStatus === 'pending' || aiStatus === 'processing') {
      return (
        <div className="bg-surface border border-subtle rounded-xl p-8 text-center space-y-3">
          <Brain className="w-8 h-8 text-cyan-500/50 mx-auto animate-pulse" />
          <p className="text-xs text-zinc-400 font-mono">
            AI Engine is generating Root Cause Analysis hypothesis...
          </p>
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

    return (
      <div className="bg-surface border border-cyan-900/40 rounded-xl p-5 space-y-5 shadow-sm">
        {/* RCA Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Autonomous Root Cause Analysis
              </h3>
              <p className="text-[10px] font-mono text-zinc-500">
                Generated at {new Date(rca.generated_at).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-bold">
              {rca.confidence}% Confidence Match
            </span>
          </div>
        </div>

        {/* Primary Summary */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Executive Hypothesis
          </h4>
          <p className="text-xs text-zinc-200 leading-relaxed font-medium bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
            {rca.summary}
          </p>
        </div>

        {/* Contributing Factors & Affected Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contributing Factors */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Contributing Factors
            </h4>
            <ul className="space-y-1.5 text-xs text-zinc-300">
              {rca.contributing_factors.map((factor, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 bg-surface-elevated/40 border border-subtle p-2 rounded-md"
                >
                  <span className="text-amber-400 font-mono font-bold">•</span>
                  <span className="leading-snug">{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Affected Systems */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-red-400" /> Affected Systems & Replicas
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {rca.affected_systems.map((sys, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-mono px-2.5 py-1 rounded bg-red-950/40 border border-red-900/50 text-red-300"
                >
                  {sys}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Deep AI Explanation */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            AI Spectral Evidence & Log Correlation
          </h4>
          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/40 border border-zinc-800 p-3 rounded-lg">
            {rca.ai_explanation}
          </p>
        </div>

        {/* Recommended Remediations */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Immediate Mitigation Checklist
          </h4>
          <div className="space-y-1.5">
            {rca.recommended_remediation.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-900/40 p-2 rounded-md font-mono"
              >
                <span className="font-bold text-emerald-400">{idx + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Code Fix */}
        {rca.suggested_code_fix && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Automated Envoy/WAF Patch Spec
              </h4>
              <button
                onClick={handleCopyPatch}
                aria-label="Copy suggested RCA fix patch"
                className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-300 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded hover:border-zinc-700"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copied ? 'Copied' : 'Copy Patch'}</span>
              </button>
            </div>
            <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-xs font-mono text-emerald-400/90 leading-relaxed overflow-x-auto">
              <pre>{rca.suggested_code_fix}</pre>
            </div>
          </div>
        )}
      </div>
    );
  }
);

RootCauseAnalysisCard.displayName = 'RootCauseAnalysisCard';
