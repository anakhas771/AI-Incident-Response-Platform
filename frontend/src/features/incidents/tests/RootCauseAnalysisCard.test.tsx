import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RootCauseAnalysisCard } from '../components/RootCauseAnalysisCard';
import { IncidentRCA } from '../types';

const mockRCA: IncidentRCA = {
  id: 'rca-1',
  incident_id: 'inc-1',
  summary: 'Envoy Thread Pool Exhaustion',
  contributing_factors: ['Factor A', 'Factor B'],
  affected_systems: ['ingress-controller'],
  confidence: 94,
  ai_explanation: 'Spectral frequency analysis matched CVE vector.',
  recommended_remediation: ['Enable Managed Challenge'],
  suggested_code_fix: 'kubectl scale deployment envoy --replicas=12',
  generated_at: new Date().toISOString(),
};

describe('RootCauseAnalysisCard', () => {
  it('renders RCA hypothesis and confidence score', () => {
    render(<RootCauseAnalysisCard rca={mockRCA} />);

    expect(screen.getByText('Autonomous Root Cause Analysis')).toBeInTheDocument();
    expect(screen.getByText('Envoy Thread Pool Exhaustion')).toBeInTheDocument();
    expect(screen.getByText('94% Confidence Match')).toBeInTheDocument();
    expect(screen.getByText('Factor A')).toBeInTheDocument();
  });
});
