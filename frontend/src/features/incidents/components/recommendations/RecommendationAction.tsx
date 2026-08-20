import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';

export interface RecommendationActionProps {
  codeSnippet?: string;
}

export const RecommendationAction: React.FC<RecommendationActionProps> = React.memo(
  ({ codeSnippet }) => {
    const [copied, setCopied] = useState(false);

    if (!codeSnippet) return null;

    const handleCopy = () => {
      navigator.clipboard.writeText(codeSnippet);
      setCopied(true);
      toast.success('Remediation command copied to clipboard', {
        style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
      });
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="relative mt-3 rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-xs font-mono">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-2">
          <span className="text-[10px] text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
            <Terminal className="w-3 h-3 text-indigo-400" /> Remediation Command / Config Patch
          </span>
          <button
            onClick={handleCopy}
            aria-label="Copy remediation code snippet"
            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-100 transition-colors bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded hover:border-zinc-700"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-zinc-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
        <pre className="text-emerald-400/90 leading-relaxed overflow-x-auto whitespace-pre-wrap">
          {codeSnippet}
        </pre>
      </div>
    );
  }
);

RecommendationAction.displayName = 'RecommendationAction';
