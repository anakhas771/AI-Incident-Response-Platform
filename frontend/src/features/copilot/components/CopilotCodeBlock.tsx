import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

export interface CopilotCodeBlockProps {
  language?: string;
  code: string;
}

/**
 * Responsive code block with language badge, copy button, and syntax styling.
 */
export const CopilotCodeBlock: React.FC<CopilotCodeBlockProps> = React.memo(
  ({ language = 'text', code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback copy
      }
    };

    return (
      <div className="my-3 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950/90 shadow-md">
        {/* Header bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-800/80 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 font-mono">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="uppercase tracking-wider font-semibold text-zinc-300">
              {language || 'code'}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            aria-label={`Copy ${language} code block`}
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-3 overflow-x-auto">
          <pre className="font-mono text-xs leading-relaxed text-zinc-200 tab-4">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    );
  }
);

CopilotCodeBlock.displayName = 'CopilotCodeBlock';
