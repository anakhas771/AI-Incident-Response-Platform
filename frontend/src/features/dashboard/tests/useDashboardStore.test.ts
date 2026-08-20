import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '../state';
import { DashboardData } from '../types';

describe('useDashboardStore', () => {
  beforeEach(() => {
    useDashboardStore.getState().reset();
  });

  it('should initialize with default state', () => {
    const state = useDashboardStore.getState();
    expect(state.data).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.selectedTimeframe).toBe('24h');
  });

  it('should update state when setData is called', () => {
    const mockData: DashboardData = {
      kpis: {
        incidentCount: 5,
        openIncidents: 2,
        resolvedIncidents: 3,
        mttrMinutes: 15,
        mttrTrendPct: -10,
        mttdMinutes: 2.1,
        mttdTrendPct: -5,
        slaCompliancePct: 99.8,
        slaTrendPct: 0.1,
      },
      recentIncidents: [],
      recentAiActivity: [],
      severityDistribution: [],
      incidentTrends: [],
      categoryDistribution: [],
      systemHealth: {
        status: 'healthy',
        backend: 'connected',
        database: 'connected',
        redis: 'connected',
        celery: 'connected',
        aiEngine: 'connected',
        knowledgeEngine: 'connected',
        lastChecked: new Date().toISOString(),
      },
    };

    useDashboardStore.getState().setData(mockData);

    const state = useDashboardStore.getState();
    expect(state.data).toEqual(mockData);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastUpdated).toBeDefined();
  });

  it('should update isLoading state', () => {
    useDashboardStore.getState().setLoading(true);
    expect(useDashboardStore.getState().isLoading).toBe(true);
  });

  it('should update error and reset isLoading when setError is called', () => {
    useDashboardStore.getState().setLoading(true);
    useDashboardStore.getState().setError('Failed to fetch metrics');

    const state = useDashboardStore.getState();
    expect(state.error).toBe('Failed to fetch metrics');
    expect(state.isLoading).toBe(false);
  });

  it('should update selectedTimeframe', () => {
    useDashboardStore.getState().setTimeframe('7d');
    expect(useDashboardStore.getState().selectedTimeframe).toBe('7d');
  });

  it('should reset state cleanly', () => {
    useDashboardStore.getState().setLoading(true);
    useDashboardStore.getState().setTimeframe('30d');
    useDashboardStore.getState().reset();

    const state = useDashboardStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.selectedTimeframe).toBe('24h');
  });
});
