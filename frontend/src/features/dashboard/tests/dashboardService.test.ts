import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    vi.resetAllMocks();
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
    expect(health.backend).toBe('connected');
    expect(health.database).toBe('connected');
    expect(health.redis).toBe('connected');
    expect(health.celery).toBe('connected');
    expect(health.aiEngine).toBe('connected');
    expect(health.knowledgeEngine).toBe('connected');
  });

  it('fetchSystemHealth should fall back to unhealthy when /health/ fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network Error'));

    const health = await dashboardService.fetchSystemHealth();

    expect(health.status).toBe('unhealthy');
    expect(health.backend).toBe('unhealthy');
    expect(health.database).toBe('unknown');
    expect(health.redis).toBe('unknown');
  });

  it('fetchDashboardData should use the monitoring analytics endpoint', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url === '/monitoring/dashboard/') {
        return {
          data: {
            kpis: {
              incidentCount: 2,
              openIncidents: 1,
              resolvedIncidents: 1,
              mttrMinutes: 12.5,
              mttrTrendPct: 0,
              mttdMinutes: null,
              mttdTrendPct: null,
              slaCompliancePct: null,
              slaTrendPct: null,
            },
            recentIncidents: [],
            recentAiActivity: [],
            severityDistribution: [
              { name: 'CRITICAL', value: 1, fill: '#ef4444' },
              { name: 'HIGH', value: 1, fill: '#f97316' },
              { name: 'MEDIUM', value: 0, fill: '#eab308' },
              { name: 'LOW', value: 0, fill: '#3b82f6' },
            ],
            categoryDistribution: [
              { name: 'Security', value: 1, fill: '#6366f1' },
              { name: 'Infrastructure', value: 1, fill: '#22d3ee' },
            ],
            incidentTrends: [],
            systemHealth: null,
          },
        };
      }

      if (url === '/health/') {
        return {
          data: {
            status: 'healthy',
            database: 'connected',
            redis: 'connected',
          },
        };
      }

      throw new Error(`Unexpected endpoint: ${url}`);
    });

    const data = await dashboardService.fetchDashboardData('24h');

    expect(data.kpis.incidentCount).toBe(2);
    expect(data.kpis.openIncidents).toBe(1);
    expect(data.kpis.resolvedIncidents).toBe(1);
    expect(data.kpis.mttrMinutes).toBe(12.5);

    expect(data.severityDistribution).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'CRITICAL', value: 1 }),
        expect.objectContaining({ name: 'HIGH', value: 1 }),
      ])
    );

    expect(data.categoryDistribution).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Security', value: 1 }),
        expect.objectContaining({ name: 'Infrastructure', value: 1 }),
      ])
    );

    expect(data.systemHealth.status).toBe('healthy');

    expect(apiClient.get).toHaveBeenCalledWith('/monitoring/dashboard/', {
      params: { timeframe: '24h' },
    });
  });

  it('fetchDashboardData should propagate analytics API failure', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url === '/monitoring/dashboard/') {
        throw new Error('API Offline');
      }

      if (url === '/health/') {
        return {
          data: {
            status: 'healthy',
            database: 'connected',
            redis: 'connected',
          },
        };
      }

      throw new Error(`Unexpected endpoint: ${url}`);
    });

    await expect(dashboardService.fetchDashboardData('24h')).rejects.toThrow('API Offline');
  });
});
