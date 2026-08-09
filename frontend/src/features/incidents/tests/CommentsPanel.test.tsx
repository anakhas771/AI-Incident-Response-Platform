import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CommentsPanel } from '../components/CommentsPanel';
import { Comment } from '../../../types';
import { mockUsers } from '../../../services/mockData';

const mockComments: Comment[] = [
  {
    id: 'c-1',
    incident_id: 'inc-1',
    author: mockUsers[0],
    message: 'Initial triage completed.',
    created_at: new Date().toISOString(),
  },
];

describe('CommentsPanel', () => {
  it('renders comments list and comment posting form', () => {
    const handlePost = vi.fn().mockResolvedValue(undefined);

    render(
      <CommentsPanel
        comments={mockComments}
        currentUser={mockUsers[0]}
        onPostComment={handlePost}
      />
    );

    expect(screen.getByText('Initial triage completed.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Add triage findings/i)).toBeInTheDocument();
  });
});
