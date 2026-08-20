import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RiskScoreWidget } from '../components/RiskScoreWidget';
import { RiskScoreMetrics } from '../types';

const mockRisk: RiskScoreMetrics = {
  incident_id: 'inc-1',
  overall_score: 94,
  trend: 'UP',
  severity: 'CRITICAL',
  color_indicator: 'red',
  ai_confidence: 96,
  breakdown: [
    { label: 'Blast Radius', score: 92, weight: 50 },
    { label: 'SLA Risk', score: 88, weight: 50 },
  ],
};

describe('RiskScoreWidget', () => {
  it('renders overall risk index score and trend metrics', () => {
    render(<RiskScoreWidget metrics={mockRisk} />);

    expect(screen.getByText('Risk assessment')).toBeInTheDocument();
    expect(screen.getByText('94')).toBeInTheDocument();
    expect(screen.getByText('Escalating')).toBeInTheDocument();
    expect(screen.getByText('Blast Radius')).toBeInTheDocument();
  });
});
