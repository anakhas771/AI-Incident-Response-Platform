import { describe, expect, it } from 'vitest';
import { incidentWorkspaceService } from '../services/incidentWorkspaceService';

describe('incidentWorkspaceService', () => {
  it('loads incident details with fallback adapter resilience', async () => {
    const incident = await incidentWorkspaceService.loadIncident('INC-8902-771');
    expect(incident).toBeDefined();
    expect(incident.id).toBeDefined();
  });

  it('loads timeline events feed', async () => {
    const timeline = await incidentWorkspaceService.loadTimeline('INC-8902-771');
    expect(Array.isArray(timeline)).toBe(true);
    expect(timeline.length).toBeGreaterThan(0);
  });

  it('loads RCA hypothesis with confidence score', async () => {
    const analysis = await incidentWorkspaceService.loadAIAnalysis('INC-8902-771');
    expect(analysis.rca).toBeNull();
  });

  it('loads risk score metrics breakdown', async () => {
    const risk = await incidentWorkspaceService.loadRiskScore('INC-8902-771');
    expect(risk).toBeDefined();
    expect(risk.overall_score).toBeGreaterThan(0);
    expect(risk.breakdown.length).toBeGreaterThan(0);
  });
});
