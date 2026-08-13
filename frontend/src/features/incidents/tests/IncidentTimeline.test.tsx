import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IncidentTimeline } from '../components/timeline/IncidentTimeline';
import { IncidentTimelineItem } from '../types';
import { mockUsers } from '../../../services/mockData';

const mockItems: IncidentTimelineItem[] = [
  {
    id: 'tl-1',
    incident_id: 'inc-1',
    event_type: 'CREATED',
    title: 'Incident Created',
    message: 'System alert triggered.',
    actor: mockUsers[0],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'tl-2',
    incident_id: 'inc-1',
    event_type: 'AI_ANALYSIS',
    title: 'AI Triage',
    message: 'AI hypothesis generated.',
    actor: null,
    timestamp: new Date().toISOString(),
  },
];

describe('IncidentTimeline', () => {
  it('renders timeline feed with event cards', () => {
    render(<IncidentTimeline timeline={mockItems} />);

    expect(screen.getByText('Incident Created')).toBeInTheDocument();
    expect(screen.getByText('AI Triage')).toBeInTheDocument();
  });

  it('filters timeline by AI engine when flag is set', () => {
    render(<IncidentTimeline timeline={mockItems} onlyAI={true} />);

    expect(screen.queryByText('Incident Created')).not.toBeInTheDocument();
    expect(screen.getByText('AI Triage')).toBeInTheDocument();
  });
});
