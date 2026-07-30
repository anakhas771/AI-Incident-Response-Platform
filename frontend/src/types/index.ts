export type Role = 'ADMIN' | 'ANALYST' | 'RESPONDER' | 'VIEWER';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type Status = 'OPEN' | 'INVESTIGATING' | 'IDENTIFIED' | 'MITIGATING' | 'RESOLVED' | 'CLOSED';

export type Category = 'Infrastructure' | 'Security' | 'Application' | 'Database' | 'Network' | 'Other';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: Role;
  organization?: Organization;
  phone_number?: string;
  is_active: boolean;
  avatar?: string;
  date_joined?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  users_count?: number;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: Status;
  category: Category;
  created_by: User;
  assigned_to?: User | null;
  organization?: Organization;
  resolved_at?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
  is_resolved?: boolean;
  is_closed?: boolean;
  comments_count?: number;
  attachments_count?: number;
  ai_summary?: AISummary;
}

export type EventType =
  | 'CREATED'
  | 'STATUS_CHANGED'
  | 'SEVERITY_CHANGED'
  | 'ASSIGNED'
  | 'COMMENT_ADDED'
  | 'AI_ANALYSIS_COMPLETED';

export interface IncidentEvent {
  id: string;
  incident_id: string;
  user?: User | null;
  event_type: EventType;
  message: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Comment {
  id: string;
  incident_id: string;
  author: User;
  message: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  incident_id: string;
  uploaded_by: User;
  file_url: string;
  filename: string;
  file_size?: string;
  uploaded_at: string;
}

export interface AISummary {
  risk_score: number; // 0 to 100
  confidence: number; // 0 to 100
  predicted_severity: Severity;
  summary: string;
  root_cause_hypothesis: string;
  recommended_actions: string[];
  suggested_code_fix?: string;
  similar_incidents: Array<{
    id: string;
    title: string;
    similarity_score: number;
    resolved_in_mins: number;
  }>;
}

export interface SystemMetrics {
  active_incidents: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  mttr_minutes: number;
  mttd_minutes: number;
  sla_compliance_pct: number;
  health_status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  severity_distribution: Array<{ name: string; value: number; fill: string }>;
  incident_trends: Array<{ timestamp: string; critical: number; high: number; medium: number; low: number }>;
  response_times: Array<{ day: string; mttr: number; mttd: number }>;
  mini_heatmap: Array<{ day: string; hour: number; value: number }>;
}

export interface ActivityLogItem {
  id: string;
  user: User;
  action: string;
  target: string;
  ip_address: string;
  timestamp: string;
  type: 'AUTH' | 'INCIDENT' | 'SYSTEM' | 'AI' | 'SECURITY';
}
