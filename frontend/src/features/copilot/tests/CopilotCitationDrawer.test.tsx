import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CopilotCitationDrawer } from '../components/CopilotCitationDrawer';
import { CopilotCitation } from '../types';

describe('CopilotCitationDrawer', () => {
  const mockCitation: CopilotCitation = {
    document_id: 'doc-1',
    document_title: 'Database Failover SOP',
    page: 14,
    chunk_index: 3,
    similarity: 0.94,
    snippet: 'When primary connection pool is exhausted, switch pgbouncer mode.',
  };

  it('renders citation metadata, similarity score, and chunk content', () => {
    const onClose = vi.fn();
    render(
      <CopilotCitationDrawer
        isOpen={true}
        citation={mockCitation}
        onClose={onClose}
        onOpenDocumentPanel={vi.fn()}
      />
    );

    expect(screen.getByText('Database Failover SOP')).toBeInTheDocument();
    expect(screen.getByText('Page 14')).toBeInTheDocument();
    expect(screen.getByText('94%')).toBeInTheDocument();
    expect(
      screen.getByText('When primary connection pool is exhausted, switch pgbouncer mode.')
    ).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <CopilotCitationDrawer
        isOpen={true}
        citation={mockCitation}
        onClose={onClose}
        onOpenDocumentPanel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Close citation drawer'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
