import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CopilotSidebar } from '../components/CopilotSidebar';
import { CopilotSession } from '../types';

describe('CopilotSidebar', () => {
  const mockSessions: CopilotSession[] = [
    {
      id: 's-1',
      title: 'INC-101 Database Incident',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
      is_pinned: true,
      unread_count: 2,
    },
    {
      id: 's-2',
      title: 'Redis Failover Log Audit',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
      is_pinned: false,
    },
  ];

  it('renders session titles and unread badges', () => {
    const onSelectSession = vi.fn();
    render(
      <CopilotSidebar
        sessions={mockSessions}
        activeSessionId="s-1"
        isLoading={false}
        searchQuery=""
        filter="all"
        onSelectSession={onSelectSession}
        onCreateSession={vi.fn()}
        onRenameSession={vi.fn()}
        onTogglePinSession={vi.fn()}
        onArchiveSession={vi.fn()}
        onDeleteSession={vi.fn()}
        onSearchChange={vi.fn()}
        onFilterChange={vi.fn()}
      />
    );

    expect(screen.getByText('INC-101 Database Incident')).toBeInTheDocument();
    expect(screen.getByText('Redis Failover Log Audit')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onCreateSession when New Investigation button is clicked', () => {
    const onCreateSession = vi.fn();
    render(
      <CopilotSidebar
        sessions={mockSessions}
        activeSessionId="s-1"
        isLoading={false}
        searchQuery=""
        filter="all"
        onSelectSession={vi.fn()}
        onCreateSession={onCreateSession}
        onRenameSession={vi.fn()}
        onTogglePinSession={vi.fn()}
        onArchiveSession={vi.fn()}
        onDeleteSession={vi.fn()}
        onSearchChange={vi.fn()}
        onFilterChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /create new conversation/i }));
    expect(onCreateSession).toHaveBeenCalledTimes(1);
  });
});
