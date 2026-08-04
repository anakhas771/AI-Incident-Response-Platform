import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourceDrawer } from '../../components/chat/SourceDrawer';
import { Citation } from '../../types/chat';

const mockCitation: Citation = {
  document_id: 'DOC-1092',
  document_title: 'Active Directory Security Policy',
  chunk_index: 4,
  page: 12,
  snippet: 'Account lockout threshold MUST be set to 5 invalid logon attempts.',
  similarity: 0.94,
};

describe('SourceDrawer Component', () => {
  it('does not render when isOpen is false', () => {
    render(<SourceDrawer isOpen={false} citation={mockCitation} onClose={() => {}} />);
    expect(screen.queryByText('Active Directory Security Policy')).toBeNull();
  });

  it('renders document title, similarity match percentage, page, and snippet when isOpen is true', () => {
    render(<SourceDrawer isOpen={true} citation={mockCitation} onClose={() => {}} />);

    expect(screen.getByText('Active Directory Security Policy')).toBeDefined();
    expect(screen.getByText('94% Match')).toBeDefined();
    expect(screen.getByText('Page 12')).toBeDefined();
    expect(screen.getByText(/Account lockout threshold MUST be set/)).toBeDefined();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<SourceDrawer isOpen={true} citation={mockCitation} onClose={handleClose} />);

    const closeBtn = screen.getByLabelText('Close source drawer');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenDocument when Open Full Document button is clicked', () => {
    const handleOpenDoc = vi.fn();
    render(
      <SourceDrawer
        isOpen={true}
        citation={mockCitation}
        onClose={() => {}}
        onOpenDocument={handleOpenDoc}
      />
    );

    const openBtn = screen.getByText('Open Full Document');
    fireEvent.click(openBtn);
    expect(handleOpenDoc).toHaveBeenCalledWith('DOC-1092');
  });
});
