import { describe, expect, it, vi, beforeEach } from 'vitest';
import { incidentWorkspaceService } from '../services/incidentWorkspaceService';
import apiClient from '../../../api/client';

vi.mock('../../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('incidentWorkspaceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads incident details', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        id: 'INC-8902-771',
        title: 'Test Incident',
        description: 'Test incident description',
        severity: 'HIGH',
        status: 'INVESTIGATING',
        category: 'Infrastructure',
        created_at: '2026-08-20T10:00:00Z',
        updated_at: '2026-08-20T10:05:00Z',
      },
    });

    const incident = await incidentWorkspaceService.loadIncident('INC-8902-771');

    expect(incident.id).toBe('INC-8902-771');
    expect(incident.title).toBe('Test Incident');
    expect(incident.status).toBe('INVESTIGATING');
  });

  it('loads timeline events feed', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          id: 'event-1',
          incident: 'INC-8902-771',
          event_type: 'CREATED',
          message: 'Incident created',
          metadata: {},
          created_at: '2026-08-20T10:00:00Z',
          user: null,
        },
      ],
    });

    const timeline = await incidentWorkspaceService.loadTimeline('INC-8902-771');

    expect(Array.isArray(timeline)).toBe(true);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].event_type).toBe('CREATED');
  });

  it('loads RCA hypothesis with confidence score', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        status: 'pending',
      },
    });

    const analysis = await incidentWorkspaceService.loadAIAnalysis('INC-8902-771');

    expect(analysis.status).toBe('pending');
    expect(analysis.rca).toBeNull();
  });

  it('loads risk score metrics breakdown', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({
        data: {
          id: 'INC-8902-771',
          title: 'Test Incident',
          severity: 'HIGH',
          status: 'INVESTIGATING',
          category: 'Infrastructure',
          created_at: '2026-08-20T10:00:00Z',
          updated_at: '2026-08-20T10:05:00Z',
        },
      })
      .mockResolvedValueOnce({
        data: {
          risk_score: 78,
          confidence_score: 0.95,
          severity_prediction: 'HIGH',
        },
      });

    const risk = await incidentWorkspaceService.loadRiskScore('INC-8902-771');

    expect(risk).toBeDefined();
    expect(risk.overall_score).toBe(78);
    expect(risk.breakdown).toHaveLength(1);
    expect(risk.breakdown[0].score).toBe(78);
  });
});
