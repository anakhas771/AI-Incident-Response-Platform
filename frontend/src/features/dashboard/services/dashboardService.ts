import apiClient from '../../../api/client';
import { Incident } from '../../../types';
import { copilotApi } from '../../../api/copilotApi';
import {
  DashboardData,
  DashboardTimeframe,
  ExecutiveKPIMetrics,
  IncidentSeverityDistributionItem,
  IncidentTrendPoint,
  RecentAiActivityItem,
  SystemHealthStatus,
  HealthStatusLevel,
} from '../types';
import { ChatSession } from '../../../types/chat';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
};

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
        if (lower === 'connected' || lower === 'healthy' || lower === 'ok') return 'connected';
        if (lower.includes('degraded')) return 'degraded';
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

  public async fetchDashboardData(timeframe: DashboardTimeframe = '24h'): Promise<DashboardData> {
    const [incidents, systemHealth, sessions] = await Promise.all([
      this.fetchIncidents(),
      this.fetchSystemHealth(),
      this.fetchCopilotSessions(),
    ]);

    return {
      kpis: this.calculateKPIs(incidents, timeframe),
      recentIncidents: this.getRecentIncidents(incidents, 6),
      recentAiActivity: this.generateAiActivityFeed(incidents, sessions),
      severityDistribution: this.calculateSeverityDistribution(incidents),
      incidentTrends: this.calculateTrends(incidents, timeframe),
      systemHealth,
    };
  }

  private async fetchIncidents(): Promise<Incident[]> {
    try {
      const response = await apiClient.get<Incident[] | { results: Incident[] }>('/incidents/');
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    } catch (error) {
      console.warn('[DashboardService] /incidents endpoint unavailable:', error);
      return [];
    }
  }

  private async fetchCopilotSessions(): Promise<ChatSession[]> {
    try {
      return await copilotApi.getSessions(false);
    } catch (error) {
      console.warn('[DashboardService] Copilot sessions unavailable:', error);
      return [];
    }
  }

  private calculateKPIs(
    incidents: Incident[],
    _timeframe: DashboardTimeframe
  ): ExecutiveKPIMetrics {
    const incidentCount = incidents.length;
    const openIncidents = incidents.filter(
      (incident) => incident.status !== 'RESOLVED' && incident.status !== 'CLOSED'
    ).length;
    const resolvedIncidents = incidentCount - openIncidents;

    const resolvedDurations = incidents
      .filter((incident) => incident.resolved_at || incident.closed_at)
      .map((incident) => {
        const completedAt = incident.resolved_at || incident.closed_at;
        if (!completedAt) return 0;
        return Math.max(
          0,
          (new Date(completedAt).getTime() - new Date(incident.created_at).getTime()) / 60000
        );
      })
      .filter((minutes) => minutes > 0);

    const mttrMinutes = resolvedDurations.length
      ? resolvedDurations.reduce((sum, minutes) => sum + minutes, 0) / resolvedDurations.length
      : 0;

    return {
      incidentCount,
      openIncidents,
      resolvedIncidents,
      mttrMinutes: Number(mttrMinutes.toFixed(1)),
      mttrTrendPct: 0,
      mttdMinutes: 0,
      mttdTrendPct: 0,
      slaCompliancePct: 0,
      slaTrendPct: 0,
    };
  }

  private calculateSeverityDistribution(incidents: Incident[]): IncidentSeverityDistributionItem[] {
    const counts: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    incidents.forEach((incident) => {
      if (counts[incident.severity] !== undefined) counts[incident.severity] += 1;
    });

    return Object.entries(counts).map(([severity, value]) => ({
      name: severity as IncidentSeverityDistributionItem['name'],
      value,
      fill: SEVERITY_COLORS[severity] || '#71717a',
    }));
  }

  private calculateTrends(
    incidents: Incident[],
    timeframe: DashboardTimeframe
  ): IncidentTrendPoint[] {
    const now = Date.now();
    const bucketCount = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30;
    const bucketSize = timeframe === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const start = now - (bucketCount - index) * bucketSize;
      return {
        start,
        timestamp:
          timeframe === '24h'
            ? new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date(start).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
    });

    incidents.forEach((incident) => {
      const created = new Date(incident.created_at).getTime();
      const bucketIndex = Math.floor((created - buckets[0].start) / bucketSize);
      if (bucketIndex < 0 || bucketIndex >= buckets.length) return;
      const bucket = buckets[bucketIndex];
      const key = incident.severity.toLowerCase() as 'critical' | 'high' | 'medium' | 'low';
      bucket[key] += 1;
    });

    return buckets.map(({ start: _start, ...bucket }) => bucket);
  }

  private getRecentIncidents(incidents: Incident[], limit: number): Incident[] {
    return [...incidents]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  private generateAiActivityFeed(
    incidents: Incident[],
    sessions: ChatSession[]
  ): RecentAiActivityItem[] {
    const feed: RecentAiActivityItem[] = [];

    sessions.forEach((session) => {
      const preview = session.last_message_preview?.trim();
      if (!preview) return;

      feed.push({
        id: `copilot-${session.id}`,
        timestamp: session.last_message_at || session.updated_at,
        incidentId: session.id,
        title: session.title || 'AI Copilot Investigation',
        type: 'SUMMARY',
        description: preview,
        confidence: 0,
        source: 'copilot',
      });
    });

    incidents.forEach((incident) => {
      const summary = incident.ai_summary;
      if (!summary) return;

      feed.push({
        id: `incident-ai-rca-${incident.id}`,
        timestamp: incident.updated_at || incident.created_at,
        incidentId: incident.id,
        title: incident.title,
        type: 'RCA',
        description: summary.root_cause_hypothesis,
        confidence: summary.confidence,
        source: 'incident-ai',
      });

      const firstAction = summary.recommended_actions?.[0];
      if (firstAction) {
        feed.push({
          id: `incident-ai-action-${incident.id}`,
          timestamp: incident.updated_at || incident.created_at,
          incidentId: incident.id,
          title: incident.title,
          type: 'RECOMMENDATION',
          description: firstAction,
          confidence: summary.confidence,
          source: 'incident-ai',
        });
      }
    });

    return feed
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
