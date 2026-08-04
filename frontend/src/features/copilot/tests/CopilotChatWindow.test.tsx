import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CopilotChatWindow } from '../components/CopilotChatWindow';
import { CopilotSession, CopilotMessage } from '../types';

describe('CopilotChatWindow', () => {
  const mockSession: CopilotSession = {
    id: 's-1',
    title: 'INC-101 Database Incident',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
  };

  const mockMessages: CopilotMessage[] = [
    {
      id: 'm-1',
      session_id: 's-1',
      role: 'user',
      content: 'What is the root cause?',
      created_at: '2026-08-01T00:00:00Z',
    },
    {
      id: 'm-2',
      session_id: 's-1',
      role: 'assistant',
      content: 'Connection pool exhausted in primary node.',
      created_at: '2026-08-01T00:00:05Z',
      confidence: { score: 95, level: 'HIGH' },
    },
  ];

  it('renders messages and confidence badge', () => {
    render(
      <CopilotChatWindow
        session={mockSession}
        messages={mockMessages}
        isStreaming={false}
        isLoadingMessages={false}
        error={null}
        currentModel="gpt-4o"
        tokenUsage={{ prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }}
        confidenceScore={{ score: 95, level: 'HIGH' }}
        onSendPrompt={vi.fn()}
        onStopGeneration={vi.fn()}
        onRegenerate={vi.fn()}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText('What is the root cause?')).toBeInTheDocument();
    expect(screen.getByText('Connection pool exhausted in primary node.')).toBeInTheDocument();
    expect(screen.getByText(/Tokens: 30/i)).toBeInTheDocument();
  });

  it('renders stop button when isStreaming is true', () => {
    const onStopGeneration = vi.fn();
    render(
      <CopilotChatWindow
        session={mockSession}
        messages={mockMessages}
        isStreaming={true}
        isLoadingMessages={false}
        error={null}
        currentModel="gpt-4o"
        tokenUsage={{ prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }}
        confidenceScore={null}
        onSendPrompt={vi.fn()}
        onStopGeneration={onStopGeneration}
        onRegenerate={vi.fn()}
        onRetry={vi.fn()}
      />
    );

    const stopBtn = screen.getByText('Stop');
    expect(stopBtn).toBeInTheDocument();
    fireEvent.click(stopBtn);
    expect(onStopGeneration).toHaveBeenCalledTimes(1);
  });
});
