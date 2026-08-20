import { Severity, Status, User } from '../../../types';

export type IncidentWorkspaceTab =
  | 'overview'
  | 'timeline'
  | 'rca'
  | 'recommendations'
  | 'similar'
  | 'comments'
  | 'attachments'
  | 'audit';

export type TimelineEventType =
  | 'CREATED'
  | 'STATUS_CHANGED'
  | 'SEVERITY_CHANGED'
  | 'ASSIGNED'
  | 'COMMENT_ADDED'
  | 'AI_ANALYSIS'
  | 'RECOMMENDATION'
  | 'ATTACHMENT'
  | 'RESOLUTION'
  | 'SYSTEM_ALERT';

export interface IncidentTimelineItem {
  id: string;
  incident_id: string;
  event_type: TimelineEventType;
  title: string;
  message: string;
  actor?: User | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
  icon_type?: 'alert' | 'user' | 'ai' | 'comment' | 'attachment' | 'check' | 'system';
}

export interface IncidentRCA {
  id: string;
  incident_id: string;
  summary: string;
  contributing_factors: string[];
  affected_systems: string[];
  confidence: number; // 0 to 100
  ai_explanation: string;
  recommended_remediation: string[];
  suggested_code_fix?: string;
  generated_at: string;
}

export type RecommendationPriority = 'P1' | 'P2' | 'P3' | 'P4';

export interface IncidentRecommendation {
  id: string;
  incident_id: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  category: string;
  confidence: number; // 0 to 100
  estimated_impact: string;
  action_type: 'AUTOMATE' | 'MANUAL' | 'CONFIG' | 'ESCALATE';
  code_snippet?: string;
  created_at: string;
}

export interface SimilarIncidentCard {
  id: string;
  title: string;
  similarity_score: number; // 0 to 100
  severity: Severity;
  resolved_in_mins: number;
  status: Status;
  root_cause_summary?: string;
  created_at?: string;
}

export interface IncidentAttachment {
  id: string;
  incident_id: string;
  filename: string;
  file_url: string;
  file_size: string;
  file_type: string;
  uploaded_by: User;
  uploaded_at: string;
  upload_progress?: number; // 0 to 100 during upload
}

export interface IncidentAuditLog {
  id: string;
  incident_id: string;
  timestamp: string;
  action_type: string;
  description: string;
  actor: User | null;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
}

export interface RiskScoreMetrics {
  incident_id: string;
  overall_score: number; // 0 to 100
  trend: 'UP' | 'DOWN' | 'STABLE';
  severity: Severity;
  color_indicator: 'red' | 'amber' | 'yellow' | 'green';
  ai_confidence: number; // 0 to 100
  breakdown: Array<{
    label: string;
    score: number;
    weight: number;
  }>;
}

export interface SystemMetadata {
  cluster_id: string;
  region: string;
  environment: 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT';
  kubernetes_namespace: string;
  impacted_services: string[];
  last_deployed_at?: string;
}

export interface IncidentWorkspaceFilters {
  search: string;
  event_type: TimelineEventType | 'ALL';
  only_ai: boolean;
}
