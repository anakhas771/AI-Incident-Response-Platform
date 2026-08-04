import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { ChatMessage } from '../../types/chat';

const mockAssistantMsg: ChatMessage = {
  id: 'msg-agent-1',
  role: 'assistant',
  content: 'The SYN flood attack has been mitigated via active routing rules.',
  created_at: new Date().toISOString(),
  citations: [
    {
      document_id: 'DOC-99',
      document_title: 'Firewall Routing Playbook',
      page: 3,
      chunk_index: 1,
      similarity: 0.91,
      snippet: 'Firewall rule 102 blocks unauthorized inbound traffic on port 443.',
    },
  ],
  usage: {
    prompt_tokens: 150,
    completion_tokens: 80,
    total_tokens: 230,
    estimated_cost: 0.003,
    latency_ms: 450,
  },
};

describe('MessageBubble Enterprise Actions & Feedback', () => {
  it('renders Like and Dislike feedback buttons and invokes onLikeToggle callback', () => {
    const handleLikeToggle = vi.fn();
    render(<MessageBubble message={mockAssistantMsg} onLikeToggle={handleLikeToggle} />);

    const likeBtn = screen.getByLabelText('Like response');
    const dislikeBtn = screen.getByLabelText('Dislike response');

    expect(likeBtn).toBeDefined();
    expect(dislikeBtn).toBeDefined();

    fireEvent.click(likeBtn);
    expect(handleLikeToggle).toHaveBeenCalledWith('msg-agent-1', true);

    fireEvent.click(dislikeBtn);
    expect(handleLikeToggle).toHaveBeenCalledWith('msg-agent-1', false);
  });

  it('renders Export Markdown and Export PDF action buttons for assistant outputs', () => {
    render(<MessageBubble message={mockAssistantMsg} />);

    expect(screen.getByLabelText('Export as Markdown')).toBeDefined();
    expect(screen.getByLabelText('Export as PDF')).toBeDefined();
  });

  it('displays synthesis latency timing when usage.latency_ms is provided', () => {
    render(<MessageBubble message={mockAssistantMsg} />);

    expect(screen.getByText('450ms')).toBeDefined();
  });

  it('invokes onOpenCitation when clicking a citation source item', () => {
    const handleOpenCit = vi.fn();
    render(<MessageBubble message={mockAssistantMsg} onOpenCitation={handleOpenCit} />);

    const toggleAccordionBtn = screen.getByText(/Verified Sources & Citations/);
    fireEvent.click(toggleAccordionBtn);

    const citationTitle = screen.getByText(/Firewall Routing Playbook/);
    fireEvent.click(citationTitle);

    expect(handleOpenCit).toHaveBeenCalledWith(mockAssistantMsg.citations![0]);
  });
});
