import apiClient from '../../../api/client';
import { copilotApi } from '../../../api/copilotApi';
import {
  DashboardData,
  DashboardTimeframe,
  SystemHealthStatus,
  HealthStatusLevel,
} from '../types';
import { ChatSession } from '../../../types/chat';

export class DashboardService {
  public async fetchSystemHealth(): Promise<SystemHealthStatus> {
    try {
      const response = await apiClient.get<{
        status?: string;
        database?: string;
        redis?: string;
      }>('/health/');

      const data = response.data;
      const isHealthy = data.status === 'healthy';

      const mapLevel = (val?: string): HealthStatusLevel => {
        if (!val) return isHealthy ? 'connected' : 'unknown';

        const lower = val.toLowerCase();

        if (['connected', 'healthy', 'ok'].includes(lower)) {
          return 'connected';
        }

        if (lower.includes('degraded')) {
          return 'degraded';
        }

        return 'unhealthy';
      };

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        backend: isHealthy ? 'connected' : 'degraded',
        database: mapLevel(data.database),
        redis: mapLevel(data.redis),
        celery: isHealthy ? 'connected' : 'unknown',
        aiEngine: isHealthy ? 'connected' : 'unknown',
        knowledgeEngine: isHealthy ? 'connected' : 'unknown',
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      console.warn('[DashboardService] /health endpoint unavailable:', error);

      return {
        status: 'unhealthy',
        backend: 'unhealthy',
        database: 'unknown',
        redis: 'unknown',
        celery: 'unknown',
        aiEngine: 'unknown',
        knowledgeEngine: 'unknown',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  public async fetchDashboardData(
    timeframe: DashboardTimeframe = '24h'
  ): Promise<DashboardData> {
    const [analytics, systemHealth] = await Promise.all([
      this.fetchAnalytics(timeframe),
      this.fetchSystemHealth(),
    ]);

    return {
      ...analytics,
      systemHealth,
    };
  }

  private async fetchAnalytics(
    timeframe: DashboardTimeframe
  ): Promise<Omit<DashboardData, 'systemHealth'>> {
    const response = await apiClient.get<Omit<DashboardData, 'systemHealth'>>(
      '/monitoring/dashboard/',
      {
        params: { timeframe },
      }
    );

    return response.data;
  }

  /**
   * Retained for any existing dashboard code that still requests
   * Copilot activity independently.
   */
  public async fetchCopilotSessions(): Promise<ChatSession[]> {
    try {
      return await copilotApi.getSessions(false);
    } catch (error) {
      console.warn('[DashboardService] Copilot sessions unavailable:', error);
      return [];
    }
  }
}

export const dashboardService = new DashboardService();

export default dashboardService;