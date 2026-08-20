import { beforeEach, describe, expect, it } from 'vitest';
import { useIncidentAIStore } from '../state/useIncidentAIStore';

describe('useIncidentAIStore', () => {
  beforeEach(() => {
    useIncidentAIStore.getState().resetAIState();
  });

  it('updates RCA root cause state', () => {
    const rca = {
      id: 'rca-1',
      incident_id: 'inc-1',
      summary: 'Test summary',
      contributing_factors: ['Factor 1'],
      affected_systems: ['sys-1'],
      confidence: 95,
      ai_explanation: 'Explanation',
      recommended_remediation: ['Remediation 1'],
      generated_at: new Date().toISOString(),
    };

    useIncidentAIStore.getState().setRootCause(rca);
    expect(useIncidentAIStore.getState().rootCause).toEqual(rca);
  });

  it('updates recommendations state', () => {
    const recs = [
      {
        id: 'rec-1',
        incident_id: 'inc-1',
        title: 'Rec 1',
        description: 'Desc 1',
        priority: 'P1' as const,
        category: 'Security',
        confidence: 90,
        estimated_impact: 'High',
        action_type: 'AUTOMATE' as const,
        created_at: new Date().toISOString(),
      },
    ];

    useIncidentAIStore.getState().setRecommendations(recs);
    expect(useIncidentAIStore.getState().recommendations).toHaveLength(1);
  });
});
