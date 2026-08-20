import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RecommendationList } from '../components/recommendations/RecommendationList';
import { IncidentRecommendation } from '../types';

const mockRecs: IncidentRecommendation[] = [
  {
    id: 'rec-1',
    incident_id: 'inc-1',
    title: 'Apply Cloudflare Rule #4092',
    description: 'Challenge unverified requests.',
    priority: 'P1',
    category: 'Perimeter',
    confidence: 97,
    estimated_impact: 'Reduces attack traffic by 90%',
    action_type: 'AUTOMATE',
    code_snippet: 'curl -X PATCH https://api.cloudflare.com/...',
    created_at: new Date().toISOString(),
  },
];

describe('RecommendationList', () => {
  it('renders recommendation items with priority badges and copy button', () => {
    render(<RecommendationList recommendations={mockRecs} />);

    expect(screen.getByText('Apply Cloudflare Rule #4092')).toBeInTheDocument();
    expect(screen.getByText('P1 Priority')).toBeInTheDocument();
    expect(screen.getByText('AUTOMATE')).toBeInTheDocument();
  });
});
