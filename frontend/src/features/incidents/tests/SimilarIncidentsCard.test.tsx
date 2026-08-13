import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SimilarIncidentsCard } from '../components/SimilarIncidentsCard';
import { SimilarIncidentCard as SimilarType } from '../types';

const mockSimilar: SimilarType[] = [
  {
    id: 'inc-9012',
    title: 'SYN Flood on Edge Gateway',
    similarity_score: 94,
    severity: 'CRITICAL',
    resolved_in_mins: 28,
    status: 'RESOLVED',
    root_cause_summary: 'Applied WAF challenge.',
  },
];

describe('SimilarIncidentsCard', () => {
  it('renders correlated historical incidents cards', () => {
    render(
      <BrowserRouter>
        <SimilarIncidentsCard similarIncidents={mockSimilar} />
      </BrowserRouter>
    );

    expect(screen.getByText('SYN Flood on Edge Gateway')).toBeInTheDocument();
    expect(screen.getByText('94% Match')).toBeInTheDocument();
    expect(screen.getByText('28 mins')).toBeInTheDocument();
  });
});
