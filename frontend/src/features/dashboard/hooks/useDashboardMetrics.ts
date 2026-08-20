import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services';
import { useDashboardStore } from '../state';
import { DashboardData, DashboardTimeframe, SystemHealthStatus } from '../types';

/**
 * Hook to fetch and sync enterprise dashboard analytics and system health metrics.
 * Integrates React Query caching with Zustand global state store.
 */
export function useDashboardMetrics(timeframe: DashboardTimeframe = '24h') {
  const { setData, setLoading, setError } = useDashboardStore();

  const query = useQuery<DashboardData, Error>({
    queryKey: ['dashboard-metrics', timeframe],
    queryFn: async () => {
      setLoading(true);

      try {
        const result = await dashboardService.fetchDashboardData(timeframe);
        setData(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch dashboard metrics';

        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 30000, // 30 seconds stale time
    refetchInterval: 60000, // Refresh every 1 minute
  });

  useEffect(() => {
    if (query.data) {
      setData(query.data);
    }
  }, [query.data, setData]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}

/**
 * Hook to fetch live system health telemetry for API, Database, Redis, Celery, and AI engines.
 */
export function useSystemHealth() {
  return useQuery<SystemHealthStatus, Error>({
    queryKey: ['system-health-telemetry'],
    queryFn: () => dashboardService.fetchSystemHealth(),
    staleTime: 15000,
    refetchInterval: 30000,
  });
}

export default useDashboardMetrics;
