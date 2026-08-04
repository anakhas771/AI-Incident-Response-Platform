import React from 'react';
import { SyntaxHighlighter } from './SyntaxHighlighter';

export interface MarkdownRendererProps {
  content: string;
  onCitationClick?: (index: number) => void;
}

/**
 * Verify URL safety against XSS attacks (blocks javascript:, vbscript:, data:, and file: schemes).
 */
/* eslint-disable-next-line react-refresh/only-export-components */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const cleaned = url.trim().toLowerCase();
  if (
    cleaned.startsWith('javascript:') ||
    cleaned.startsWith('vbscript:') ||
    cleaned.startsWith('data:') ||
    cleaned.startsWith('file:')
  ) {
    return false;
  }
  return true;
}

/**
 * Format inline tokens: **bold**, *italic*, `code`, [link](url), and [1] citations.
 */
function renderInline(text: string, onCitationClick?: (index: number) => void): React.ReactNode[] {
  // Regex to split on code `...`, bold **...**, italic *...*, citation [N], or link [title](url)
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[\d+\]|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-zinc-800 text-indigo-300 font-mono text-xs border border-zinc-700/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-zinc-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-zinc-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    const citMatch = part.match(/^\[(\d+)\]$/);
    if (citMatch) {
      const citNum = parseInt(citMatch[1], 10);
      return (
        <button
          key={idx}
          onClick={() => onCitationClick?.(citNum - 1)}
          className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 hover:bg-indigo-500/30 transition-colors"
          title={`Jump to citation [${citNum}]`}
        >
          [{citNum}]
        </button>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const linkUrl = linkMatch[2];
      if (isSafeUrl(linkUrl)) {
        return (
          <a
            key={idx}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center gap-0.5 font-medium transition-colors"
          >
            {linkText}
          </a>
        );
      } else {
        // Block dangerous XSS URL
        return (
          <span
            key={idx}
            className="text-rose-400 bg-rose-950/40 border border-rose-800/40 px-1 rounded text-xs"
            title="Blocked unsafe script link"
          >
            [Blocked Link: {linkText}]
          </span>
        );
      }
    }
    return <span key={idx}>{part}</span>;
  });
}

/**
 * Custom zero-dependency Markdown block parser for ChatGPT-quality streaming chat.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onCitationClick }) => {
  if (!content) return null;

  // Split content by triple backticks for code block extraction
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const blocks: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [fullMatch, lang, code] = match;
    const matchIndex = match.index;

    // Process preceding markdown text
    if (matchIndex > lastIndex) {
      const textChunk = content.substring(lastIndex, matchIndex);
      blocks.push(
        <div key={`text-${lastIndex}`} className="space-y-2">
          {renderMarkdownText(textChunk, onCitationClick)}
        </div>
      );
    }

    // Render highlighted code block
    blocks.push(
      <SyntaxHighlighter key={`code-${matchIndex}`} code={code.trim()} language={lang || 'code'} />
    );

    lastIndex = matchIndex + fullMatch.length;
  }

  // Render remaining trailing text
  if (lastIndex < content.length) {
    const trailingText = content.substring(lastIndex);
    blocks.push(
      <div key={`text-${lastIndex}`} className="space-y-2">
        {renderMarkdownText(trailingText, onCitationClick)}
      </div>
    );
  }

  return <div className="space-y-3 text-sm leading-relaxed text-zinc-300">{blocks}</div>;
};

/**
 * Parse non-code Markdown block text (headings, lists, blockquotes, tables, paragraphs).
 */
function renderMarkdownText(
  text: string,
  onCitationClick?: (index: number) => void
): React.ReactNode[] {
  const lines = text.split('\n');
  const rendered: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = (idx: number) => {
    if (tableRows.length === 0) return null;
    const headers = tableRows[0];
    const dataRows = tableRows.slice(2); // Skip separator row

    const elem = (
      <div
        key={`tbl-${idx}`}
        className="my-3 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/60"
      >
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900 text-zinc-300 font-semibold border-b border-zinc-800">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="p-2 border-r last:border-none border-zinc-800">
                  {renderInline(h.trim(), onCitationClick)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-400">
            {dataRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-zinc-900/40">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2 border-r last:border-none border-zinc-800/60">
                    {renderInline(cell.trim(), onCitationClick)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
    return elem;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      const cells = trimmed
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      const tableElem = flushTable(i);
      if (tableElem) rendered.push(tableElem);
    }

    if (!trimmed) {
      rendered.push(<div key={`br-${i}`} className="h-1" />);
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      rendered.push(
        <h3 key={`h3-${i}`} className="text-base font-bold text-zinc-100 mt-3 mb-1">
          {renderInline(trimmed.substring(4), onCitationClick)}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      rendered.push(
        <h2
          key={`h2-${i}`}
          className="text-lg font-bold text-zinc-100 mt-4 mb-2 border-b border-zinc-800/80 pb-1"
        >
          {renderInline(trimmed.substring(3), onCitationClick)}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      rendered.push(
        <h1 key={`h1-${i}`} className="text-xl font-bold text-zinc-100 mt-4 mb-2">
          {renderInline(trimmed.substring(2), onCitationClick)}
        </h1>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      rendered.push(
        <blockquote
          key={`bq-${i}`}
          className="pl-4 py-1.5 border-l-2 border-indigo-500 bg-indigo-500/5 text-zinc-400 italic rounded-r my-2"
        >
          {renderInline(trimmed.substring(2), onCitationClick)}
        </blockquote>
      );
      continue;
    }

    // Unordered lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      rendered.push(
        <li key={`li-${i}`} className="ml-5 list-disc text-zinc-300">
          {renderInline(trimmed.substring(2), onCitationClick)}
        </li>
      );
      continue;
    }

    // Ordered lists
    const ordMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (ordMatch) {
      rendered.push(
        <li key={`ord-${i}`} className="ml-5 list-decimal text-zinc-300">
          {renderInline(ordMatch[2], onCitationClick)}
        </li>
      );
      continue;
    }

    // Standard paragraph line
    rendered.push(
      <p key={`p-${i}`} className="text-zinc-300">
        {renderInline(trimmed, onCitationClick)}
      </p>
    );
  }

  if (inTable) {
    const tableElem = flushTable(lines.length);
    if (tableElem) rendered.push(tableElem);
  }

  return rendered;
}
