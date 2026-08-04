import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';

export interface SyntaxHighlighterProps {
  code: string;
  language?: string;
}

const KEYWORDS = new Set([
  'const',
  'let',
  'var',
  'function',
  'return',
  'import',
  'export',
  'from',
  'default',
  'class',
  'interface',
  'type',
  'if',
  'else',
  'try',
  'catch',
  'finally',
  'async',
  'await',
  'def',
  'lambda',
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'ON',
  'INSERT',
  'UPDATE',
  'DELETE',
]);

/**
 * Simple tokenizing highlight helper for zero-dependency syntax coloring.
 */
function highlightCodeTokens(code: string): React.ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, lineIdx) => {
    // Check for comment
    if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
      return (
        <div key={lineIdx} className="text-zinc-500 italic">
          {line}
        </div>
      );
    }

    const tokens = line.split(/(\s+|[(){}[\];,.<>=+\-*/:"'`]+)/g);
    const renderedLine = tokens.map((token, tokIdx) => {
      if (KEYWORDS.has(token)) {
        return (
          <span key={tokIdx} className="text-indigo-400 font-semibold">
            {token}
          </span>
        );
      }
      if (/^["'`].*["'`]$/.test(token)) {
        return (
          <span key={tokIdx} className="text-emerald-400">
            {token}
          </span>
        );
      }
      if (/^\d+$/.test(token)) {
        return (
          <span key={tokIdx} className="text-amber-400">
            {token}
          </span>
        );
      }
      if (/^(true|false|null|undefined|None|True|False)$/.test(token)) {
        return (
          <span key={tokIdx} className="text-rose-400">
            {token}
          </span>
        );
      }
      return <span key={tokIdx}>{token}</span>;
    });

    return (
      <div key={lineIdx} className="leading-relaxed font-mono text-xs">
        {renderedLine}
      </div>
    );
  });
}

export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({
  code,
  language = 'code',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code snippet copied to clipboard', {
      style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 shadow-lg">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="uppercase font-semibold tracking-wider text-[11px]">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          aria-label="Copy code snippet"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3 overflow-x-auto text-zinc-200">{highlightCodeTokens(code)}</div>
    </div>
  );
};
