import { Incident, Severity } from '../../../types';

export interface ExecutiveKPIMetrics {
  incidentCount: number;
  openIncidents: number;
  resolvedIncidents: number;
  mttrMinutes: number | null;
  mttrTrendPct: number | null;
  mttdMinutes: number | null;
  mttdTrendPct: number | null;
  slaCompliancePct: number | null;
  slaTrendPct: number | null;
}

export interface IncidentSeverityDistributionItem {
  name: Severity;
  value: number;
  fill: string;
}

export interface IncidentCategoryDistributionItem {
  name: string;
  value: number;
  fill: string;
}

export interface IncidentCategoryDistributionItem {
  name: string;
  value: number;
  fill: string;
}
export interface IncidentTrendPoint {
  timestamp: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export type AiActivityType = 'RCA' | 'RECOMMENDATION' | 'SUMMARY' | 'TRIAGE';
export type AiActivitySource = 'incident-ai' | 'copilot';

export interface RecentAiActivityItem {
  id: string;
  timestamp: string;
  incidentId: string;
  title: string;
  type: AiActivityType;
  description: string;
  confidence: number;
  source?: AiActivitySource;
}

export type HealthStatusLevel = 'connected' | 'degraded' | 'unhealthy' | 'unknown';

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  backend: HealthStatusLevel;
  database: HealthStatusLevel;
  redis: HealthStatusLevel;
  celery: HealthStatusLevel;
  aiEngine: HealthStatusLevel;
  knowledgeEngine: HealthStatusLevel;
  lastChecked: string;
}

export interface DashboardData {
  kpis: ExecutiveKPIMetrics;
  recentIncidents: Incident[];
  recentAiActivity: RecentAiActivityItem[];
  severityDistribution: IncidentSeverityDistributionItem[];
  categoryDistribution: IncidentCategoryDistributionItem[];
  incidentTrends: IncidentTrendPoint[];
  systemHealth: SystemHealthStatus;
}

export type DashboardTimeframe = '24h' | '7d' | '30d';
