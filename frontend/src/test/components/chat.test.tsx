import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MarkdownRenderer } from '../../components/chat/MarkdownRenderer';
import { SyntaxHighlighter } from '../../components/chat/SyntaxHighlighter';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { ChatMessage } from '../../types/chat';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('MarkdownRenderer - zero dependency markdown block parser', () => {
  it('should render headings, paragraphs, and citations correctly', () => {
    const markdown =
      `### Root Cause Analysis\n` +
      `The connection lifetime exceeded 2500ms threshold [1].\n` +
      `- Finding 1: Unbounded pool\n` +
      `- Finding 2: SYN flood`;

    render(<MarkdownRenderer content={markdown} />);

    expect(screen.getByText('Root Cause Analysis')).toBeInTheDocument();
    expect(screen.getByText('Finding 1: Unbounded pool')).toBeInTheDocument();
    expect(screen.getByText('[1]')).toBeInTheDocument();
  });

  it('should render code blocks via SyntaxHighlighter', () => {
    const content = `Here is the fix:\n\`\`\`typescript\nconst connPool = new Pool();\n\`\`\``;

    render(<MarkdownRenderer content={content} />);

    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('const')).toBeInTheDocument();
  });
});

describe('SyntaxHighlighter - code header and copy action', () => {
  it('should render language label and copy button', () => {
    render(<SyntaxHighlighter code="const x = 42;" language="javascript" />);

    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(screen.getByLabelText('Copy code snippet')).toBeInTheDocument();
  });
});

describe('MessageBubble - ChatGPT-quality chat turn', () => {
  const assistantMsg: ChatMessage = {
    id: 'ai-1',
    role: 'assistant',
    content: 'Anomalies detected in auth-service.',
    created_at: '2026-08-03T12:00:00Z',
    confidence: {
      score: 95,
      level: 'HIGH',
      reasons: ['High citation similarity'],
    },
    citations: [
      {
        document_id: 'doc-101',
        document_title: 'Auth Pool Spec',
        page: 12,
        chunk_index: 2,
        similarity: 0.91,
        snippet: 'Max active conns = 100',
      },
    ],
    usage: {
      prompt_tokens: 150,
      completion_tokens: 350,
      total_tokens: 500,
      estimated_cost: 0.0025,
      model: 'GPT-4O-SECURITY',
    },
  };

  it('should display SOC agent label, confidence badge, and usage metrics', () => {
    render(<MessageBubble message={assistantMsg} />);

    expect(screen.getByText('SOC Security Agent')).toBeInTheDocument();
    expect(screen.getByText(/HIGH: 95%/)).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('GPT-4O-SECURITY')).toBeInTheDocument();
  });

  it('should toggle citations accordion when clicked', () => {
    render(<MessageBubble message={assistantMsg} />);

    const button = screen.getByText(/Verified Sources & Citations \(1\)/i);
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByText(/Auth Pool Spec/)).toBeInTheDocument();
    expect(screen.getByText(/Max active conns = 100/)).toBeInTheDocument();
  });

  it('should render operator label for user messages', () => {
    const userMsg: ChatMessage = {
      id: 'user-1',
      role: 'user',
      content: 'Analyze RCA for SYN flood',
      created_at: '2026-08-03T11:59:00Z',
    };

    render(<MessageBubble message={userMsg} />);

    expect(screen.getByText('Operator')).toBeInTheDocument();
    expect(screen.getByText('Analyze RCA for SYN flood')).toBeInTheDocument();
  });
});
