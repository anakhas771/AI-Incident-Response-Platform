import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '../services';
import apiClient from '../../../api/client';

vi.mock('../../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchSystemHealth should return healthy status when /health/ returns healthy', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        status: 'healthy',
        database: 'connected',
        redis: 'connected',
      },
    });

    const health = await dashboardService.fetchSystemHealth();

    expect(health.status).toBe('healthy');
    expect(health.database).toBe('connected');
    expect(health.redis).toBe('connected');
    expect(health.celery).toBe('connected');
    expect(health.aiEngine).toBe('connected');
    expect(health.knowledgeEngine).toBe('connected');
  });

  it('fetchSystemHealth should fall back gracefully when /health/ endpoint fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network Error'));

    const health = await dashboardService.fetchSystemHealth();

    expect(health.status).toBe('healthy');
    expect(health.backend).toBe('connected');
  });

  it('fetchDashboardData should calculate KPIs and severity distribution correctly', async () => {
    const mockApiIncidents = [
      {
        id: 'inc-test-1',
        title: 'Test Critical Incident',
        description: 'Test description',
        severity: 'CRITICAL',
        status: 'INVESTIGATING',
        category: 'Security',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T11:00:00Z',
      },
      {
        id: 'inc-test-2',
        title: 'Test Resolved Incident',
        description: 'Test description 2',
        severity: 'HIGH',
        status: 'RESOLVED',
        category: 'Infrastructure',
        created_at: '2025-01-01T09:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      },
    ];

    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: mockApiIncidents }) // /incidents/
      .mockResolvedValueOnce({
        data: { status: 'healthy', database: 'connected', redis: 'connected' },
      }); // /health/

    const data = await dashboardService.fetchDashboardData('24h');

    expect(data.kpis.incidentCount).toBe(2);
    expect(data.kpis.openIncidents).toBe(1);
    expect(data.kpis.resolvedIncidents).toBe(1);
    expect(data.severityDistribution).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'CRITICAL', value: 1 }),
        expect.objectContaining({ name: 'HIGH', value: 1 }),
      ])
    );
  });

  it('fetchDashboardData should use mock adapter when /incidents/ endpoint fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('API Offline'));

    const data = await dashboardService.fetchDashboardData('24h');

    expect(data.kpis.incidentCount).toBeGreaterThan(0);
    expect(Array.isArray(data.recentIncidents)).toBe(true);
    expect(Array.isArray(data.incidentTrends)).toBe(true);
    expect(data.systemHealth).toBeDefined();
  });
});
