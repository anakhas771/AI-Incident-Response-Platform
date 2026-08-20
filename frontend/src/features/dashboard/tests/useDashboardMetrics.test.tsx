import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardMetrics, useSystemHealth } from '../hooks';
import { dashboardService } from '../services';

vi.mock('../services', () => ({
  dashboardService: {
    fetchDashboardData: vi.fn(),
    fetchSystemHealth: vi.fn(),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useDashboardMetrics and useSystemHealth Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useDashboardMetrics should fetch dashboard data and update state', async () => {
    const mockData = {
      kpis: {
        incidentCount: 10,
        openIncidents: 4,
        resolvedIncidents: 6,
        mttrMinutes: 20,
        mttrTrendPct: -12,
        mttdMinutes: 3,
        mttdTrendPct: -5,
        slaCompliancePct: 99.5,
        slaTrendPct: 0.1,
      },
      recentIncidents: [],
      recentAiActivity: [],
      severityDistribution: [],
      incidentTrends: [],
      categoryDistribution: [],
      systemHealth: {
        status: 'healthy' as const,
        backend: 'connected' as const,
        database: 'connected' as const,
        redis: 'connected' as const,
        celery: 'connected' as const,
        aiEngine: 'connected' as const,
        knowledgeEngine: 'connected' as const,
        lastChecked: new Date().toISOString(),
      },
    };

    vi.mocked(dashboardService.fetchDashboardData).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useDashboardMetrics('24h'), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isError).toBe(false);
  });

  it('useSystemHealth should fetch system health telemetry', async () => {
    const mockHealth = {
      status: 'healthy' as const,
      backend: 'connected' as const,
      database: 'connected' as const,
      redis: 'connected' as const,
      celery: 'connected' as const,
      aiEngine: 'connected' as const,
      knowledgeEngine: 'connected' as const,
      lastChecked: new Date().toISOString(),
    };

    vi.mocked(dashboardService.fetchSystemHealth).mockResolvedValueOnce(mockHealth);

    const { result } = renderHook(() => useSystemHealth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockHealth);
  });
});
