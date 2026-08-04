import React from 'react';
import { CopilotCodeBlock } from './CopilotCodeBlock';
import { Network } from 'lucide-react';
import { isSafeUrl } from '../utils/security';

export interface CopilotMarkdownProps {
  content: string;
  onCitationClick?: (index: number) => void;
}

/**
 * Format inline markdown elements: bold, italic, inline code, citations [N], safe links, and images.
 */
function renderInline(text: string, onCitationClick?: (index: number) => void): React.ReactNode[] {
  // Regex to match images ![alt](url), links [title](url), citations [N], inline code `...`, bold **...**, italic *...*
  const parts = text.split(
    /(!\[[^\]]*\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[\d+\]|\[[^\]]+\]\([^)]+\))/g
  );

  return parts.map((part, idx) => {
    if (!part) return null;

    // Image ![alt](url)
    const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      const altText = imgMatch[1] || 'Embedded image';
      const imgUrl = imgMatch[2];
      if (isSafeUrl(imgUrl)) {
        return (
          <img
            key={idx}
            src={imgUrl}
            alt={altText}
            className="my-2 max-h-64 rounded-lg border border-zinc-800 object-contain bg-zinc-900"
          />
        );
      } else {
        return (
          <span
            key={idx}
            className="text-rose-400 bg-rose-950/40 border border-rose-800/40 px-1.5 py-0.5 rounded text-xs"
          >
            [Blocked Image Source]
          </span>
        );
      }
    }

    // Inline code
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

    // Bold
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-zinc-100">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-zinc-300">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Citations [N]
    const citMatch = part.match(/^\[(\d+)\]$/);
    if (citMatch) {
      const citNum = parseInt(citMatch[1], 10);
      return (
        <button
          key={idx}
          onClick={() => onCitationClick?.(citNum - 1)}
          className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 hover:bg-indigo-500/30 transition-colors"
          title={`Jump to verified citation [${citNum}]`}
          aria-label={`Citation ${citNum}`}
        >
          [{citNum}]
        </button>
      );
    }

    // Link [title](url)
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
        return (
          <span
            key={idx}
            className="text-rose-400 bg-rose-950/40 border border-rose-800/40 px-1 rounded text-xs"
            title="Blocked unsafe link"
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
 * Enterprise Markdown renderer supporting headings, tables, lists, task lists, code blocks, blockquotes, citations, and mermaid diagrams.
 */
export const CopilotMarkdown: React.FC<CopilotMarkdownProps> = React.memo(
  ({ content, onCitationClick }) => {
    if (!content) return null;

    // Split content by fenced code blocks (```lang\ncode\n```)
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const blocks: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const [fullMatch, lang, code] = match;
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        const textBefore = content.substring(lastIndex, matchIndex);
        blocks.push(...renderMarkdownText(textBefore, onCitationClick, `txt-${matchIndex}`));
      }

      if (lang.toLowerCase() === 'mermaid') {
        blocks.push(
          <div
            key={`mermaid-${matchIndex}`}
            className="my-3 p-4 rounded-lg bg-zinc-900/90 border border-indigo-500/30 text-xs font-mono"
            role="region"
            aria-label="Mermaid Architecture Diagram"
          >
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-800 text-indigo-400 font-semibold">
              <Network className="w-4 h-4" />
              <span>Mermaid Architecture Diagram (Interactive)</span>
            </div>
            <pre className="overflow-x-auto text-zinc-300">
              <code>{code.trim()}</code>
            </pre>
          </div>
        );
      } else {
        blocks.push(
          <CopilotCodeBlock
            key={`code-${matchIndex}`}
            language={lang || 'text'}
            code={code.trim()}
          />
        );
      }

      lastIndex = matchIndex + fullMatch.length;
    }

    if (lastIndex < content.length) {
      const textAfter = content.substring(lastIndex);
      blocks.push(...renderMarkdownText(textAfter, onCitationClick, `txt-${lastIndex}`));
    }

    return <div className="space-y-2 text-sm leading-relaxed">{blocks}</div>;
  }
);

CopilotMarkdown.displayName = 'CopilotMarkdown';

/**
 * Render non-code markdown paragraphs, headings, tables, blockquotes, lists, and task lists.
 */
function renderMarkdownText(
  text: string,
  onCitationClick?: (index: number) => void,
  prefix = 'md'
): React.ReactNode[] {
  const lines = text.split(/\r?\n/);
  const rendered: React.ReactNode[] = [];
  let inTable = false;
  const tableRows: string[][] = [];

  const flushTable = (endIdx: number): React.ReactNode | null => {
    if (tableRows.length === 0) return null;
    const header = tableRows[0];
    const body = tableRows.slice(1).filter((row) => {
      // Ignore markdown separator row like | --- | --- |
      return !row.every((cell) => /^[-: ]+$/.test(cell));
    });

    const elem = (
      <div
        key={`${prefix}-table-${endIdx}`}
        className="my-3 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/60"
      >
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-300 font-semibold">
              {header.map((col, i) => (
                <th key={i} className="px-3 py-2 border-r border-zinc-800/50 last:border-r-0">
                  {renderInline(col, onCitationClick)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-zinc-900/40 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 border-r border-zinc-800/50 last:border-r-0">
                    {renderInline(cell, onCitationClick)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows.length = 0;
    inTable = false;
    return elem;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Table rows
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
      rendered.push(<div key={`${prefix}-br-${i}`} className="h-1" />);
      continue;
    }

    // Headings
    if (trimmed.startsWith('#### ')) {
      rendered.push(
        <h4 key={`${prefix}-h4-${i}`} className="text-sm font-bold text-zinc-200 mt-3 mb-1">
          {renderInline(trimmed.substring(5), onCitationClick)}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('### ')) {
      rendered.push(
        <h3 key={`${prefix}-h3-${i}`} className="text-base font-bold text-zinc-100 mt-3 mb-1">
          {renderInline(trimmed.substring(4), onCitationClick)}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      rendered.push(
        <h2
          key={`${prefix}-h2-${i}`}
          className="text-lg font-bold text-zinc-100 mt-4 mb-2 border-b border-zinc-800/80 pb-1"
        >
          {renderInline(trimmed.substring(3), onCitationClick)}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      rendered.push(
        <h1 key={`${prefix}-h1-${i}`} className="text-xl font-bold text-zinc-100 mt-4 mb-2">
          {renderInline(trimmed.substring(2), onCitationClick)}
        </h1>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      rendered.push(
        <blockquote
          key={`${prefix}-bq-${i}`}
          className="pl-4 py-1.5 border-l-2 border-indigo-500 bg-indigo-500/5 text-zinc-300 italic rounded-r my-2"
        >
          {renderInline(trimmed.substring(2), onCitationClick)}
        </blockquote>
      );
      continue;
    }

    // Task list items "- [ ] " or "- [x] "
    const taskMatch = trimmed.match(/^-\s+\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      const isChecked = taskMatch[1].toLowerCase() === 'x';
      const taskText = taskMatch[2];
      rendered.push(
        <div key={`${prefix}-task-${i}`} className="flex items-start gap-2 ml-4 my-1 text-zinc-300">
          <input
            type="checkbox"
            checked={isChecked}
            readOnly
            className="mt-1 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500"
            aria-label={`Task: ${taskText}`}
          />
          <span className={isChecked ? 'line-through text-zinc-500' : ''}>
            {renderInline(taskText, onCitationClick)}
          </span>
        </div>
      );
      continue;
    }

    // Unordered lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      rendered.push(
        <li key={`${prefix}-li-${i}`} className="ml-5 list-disc text-zinc-300">
          {renderInline(trimmed.substring(2), onCitationClick)}
        </li>
      );
      continue;
    }

    // Ordered lists
    const ordMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (ordMatch) {
      rendered.push(
        <li key={`${prefix}-ord-${i}`} className="ml-5 list-decimal text-zinc-300">
          {renderInline(ordMatch[2], onCitationClick)}
        </li>
      );
      continue;
    }

    // Standard paragraph line
    rendered.push(
      <p key={`${prefix}-p-${i}`} className="text-zinc-300">
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
