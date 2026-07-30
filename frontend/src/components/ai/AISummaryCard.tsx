import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldAlert, CheckCircle2, Copy, Check, Terminal, Cpu } from 'lucide-react';
import { AISummary } from '../../types';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import toast from 'react-hot-toast';

interface AISummaryCardProps {
  summary: AISummary;
  incidentTitle?: string;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({ summary }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

  const handleCopyCode = () => {
    if (summary.suggested_code_fix) {
      navigator.clipboard.writeText(summary.suggested_code_fix);
      setCopiedCode(true);
      toast.success('Code snippet copied to clipboard', {
        style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
      });
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const toggleAction = (idx: number) => {
    setCompletedActions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <Card
      aiGlow
      hoverEffect={false}
      className="relative overflow-hidden border-indigo-900/50 bg-surface-elevated"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-indigo-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span>AI Security Copilot Analysis</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
                v2.4 REAL-TIME
              </span>
            </CardTitle>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 uppercase font-mono block">Confidence</span>
            <span className="text-xs font-mono font-semibold text-emerald-400">
              {summary.confidence}%
            </span>
          </div>
          <div className="px-3 py-1 rounded-lg bg-red-950/60 border border-red-800/60 text-right">
            <span className="text-[10px] text-red-400/80 uppercase font-mono block">
              Risk Score
            </span>
            <span className="text-sm font-mono font-bold text-red-400">
              {summary.risk_score}/100
            </span>
          </div>
        </div>
      </CardHeader>

      <div className="space-y-5 pt-3">
        <div>
          <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Automated Triage Summary
          </p>
          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
            {summary.summary}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-400" /> Predicted Root Cause
          </p>
          <div className="p-3 rounded-lg bg-orange-950/20 border border-orange-900/40 text-xs text-orange-200">
            {summary.root_cause_hypothesis}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Recommended Mitigation Steps
          </p>
          <div className="space-y-2">
            {summary.recommended_actions.map((action, idx) => (
              <motion.div
                key={idx}
                whileTap={{ scale: 0.99 }}
                onClick={() => toggleAction(idx)}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  completedActions[idx]
                    ? 'bg-emerald-950/30 border-emerald-800/50 text-zinc-400 line-through'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:border-indigo-800/60'
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    completedActions[idx]
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'border-zinc-700'
                  }`}
                >
                  {completedActions[idx] && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <span className="flex-1">{action}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {summary.suggested_code_fix && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Automated Remediation Code
                Snippet
              </p>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-cyan-300/90 leading-relaxed overflow-x-auto">
              <pre>{summary.suggested_code_fix}</pre>
            </div>
          </div>
        )}

        {summary.similar_incidents.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Historically Similar Incidents
            </p>
            <div className="space-y-1.5">
              {summary.similar_incidents.map((sim) => (
                <div
                  key={sim.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[10px] text-zinc-400">{sim.id}</span>
                    <span className="truncate text-zinc-300">{sim.title}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono text-indigo-400">
                      {sim.similarity_score}% match
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {sim.resolved_in_mins}m resolution
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
