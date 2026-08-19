import apiClient from '../../../api/client';
import { Comment, Incident, Status, User } from '../../../types';
import {
  IncidentAttachment,
  IncidentAuditLog,
  IncidentRCA,
  IncidentRecommendation,
  IncidentTimelineItem,
  RiskScoreMetrics,
  SimilarIncidentCard,
  SystemMetadata,
} from '../types';

interface IncidentAnalysisPayload {
  status?: string;
  summary?: string;
  severity_prediction?: string;
  risk_score?: number;
  confidence_score?: number;
  incident_category?: string;
  root_cause_analysis?: string;
  impact_analysis?: string;
  recommended_actions?: string[];
  recommendations?: string[];
  similar_incidents?: SimilarIncidentPayload[];
  knowledge_citations?: unknown[];
  updated_at?: string;
}

interface SimilarIncidentPayload {
  id: string;
  title: string;
  similarity?: number;
  resolved_in_mins?: number;
  severity?: Incident['severity'];
  status?: Status;
  root_cause_summary?: string;
  created_at?: string;
}

interface IncidentAttachmentResponse {
  id: string;
  incident_id: string;
  filename: string;
  file_url: string;
  file_size?: string;
  uploaded_by?: User;
  uploaded_at?: string;
}

class IncidentWorkspaceService {
  private readonly analysisRequested = new Set<string>();

  async loadIncident(id: string): Promise<Incident> {
    const response = await apiClient.get<Incident>(`/incidents/${id}/`);
    return response.data;
  }

  async loadTimeline(id: string): Promise<IncidentTimelineItem[]> {
    const response = await apiClient.get<
      Array<{
        id: string;
        incident_id?: string;
        event_type?: string;
        message: string;
        created_at?: string;
        user?: User;
        metadata?: Record<string, unknown>;
      }>
    >(`/incidents/${id}/timeline/`);

    return response.data.map((item) => ({
      id: item.id,
      incident_id: item.incident_id || id,
      event_type: this.mapEventType(item.event_type),
      title: this.mapEventTitle(item.event_type),
      message: item.message,
      actor: item.user || null,
      timestamp: item.created_at || new Date().toISOString(),
      metadata: item.metadata || {},
      icon_type: this.mapEventIcon(item.event_type),
    }));
  }

  async loadAIAnalysis(id: string): Promise<{
    status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
    summary: string | null;
    rca: IncidentRCA | null;
    recommendations: IncidentRecommendation[];
    similarIncidents: SimilarIncidentCard[];
  }> {
    try {
      const response = await apiClient.get<IncidentAnalysisPayload>(`/ai/incidents/${id}/analysis/`);
      const data = response.data || {};
      const status = this.normalizeAIStatus(data.status);
      const summary = data.summary || null;

      if (status === 'pending' || status === 'processing') {
        return { status, summary, rca: null, recommendations: [], similarIncidents: [] };
      }

      const confidence = data.confidence_score ?? 0;
      const recommendationsRaw = data.recommended_actions || data.recommendations || [];
      const recommendations = recommendationsRaw.map((recommendation, index) => ({
        id: `rec-${id}-${index}`,
        incident_id: id,
        title: recommendation,
        description: recommendation,
        priority: (index === 0 ? 'P1' : index === 1 ? 'P2' : 'P3') as 'P1' | 'P2' | 'P3',
        category: data.incident_category || 'Incident response',
        confidence: Math.round(confidence * 100),
        estimated_impact: 'AI-generated mitigation based on the incident context',
        action_type: 'MANUAL' as const,
        created_at: data.updated_at || new Date().toISOString(),
      }));

      const rca = data.root_cause_analysis || data.impact_analysis || data.summary
        ? {
            id: `rca-${id}`,
            incident_id: id,
            summary: data.summary || 'AI analysis completed.',
            contributing_factors: data.impact_analysis ? [data.impact_analysis] : [],
            affected_systems: [],
            confidence: Math.round(confidence * 100),
            ai_explanation: data.root_cause_analysis || 'No root-cause narrative was returned by the AI engine.',
            recommended_remediation: recommendationsRaw,
            generated_at: data.updated_at || new Date().toISOString(),
          }
        : null;

      const similarIncidents = (data.similar_incidents || []).map((item) => ({
        id: item.id,
        title: item.title,
        similarity_score: Math.round((item.similarity ?? 0) * 100),
        resolved_in_mins: item.resolved_in_mins ?? 0,
        severity: item.severity ?? 'MEDIUM',
        status: item.status ?? 'OPEN',
        root_cause_summary: item.root_cause_summary,
        created_at: item.created_at,
      }));

      return { status, summary, rca, recommendations, similarIncidents };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error?.response?.status === 404 && !this.analysisRequested.has(id)) {
        this.analysisRequested.add(id);
        await this.triggerAIAnalyze(id);
        return { status: 'pending', summary: null, rca: null, recommendations: [], similarIncidents: [] };
      }
      throw error;
    }
  }

  async loadAuditTrail(id: string): Promise<IncidentAuditLog[]> {
    const response = await apiClient.get<
      Array<{
        id: string;
        event_type?: string;
        message: string;
        created_at?: string;
        user?: User;
        metadata?: Record<string, unknown>;
      }>
    >(`/incidents/${id}/timeline/`);

    return response.data.map((item, index) => ({
      id: item.id || `audit-${index}`,
      incident_id: id,
      timestamp: item.created_at || new Date().toISOString(),
      action_type: item.event_type || 'SYSTEM_EVENT',
      description: item.message,
      actor: item.user || null,
      old_value: item.metadata?.old_status ? String(item.metadata.old_status) : undefined,
      new_value: item.metadata?.new_status ? String(item.metadata.new_status) : undefined,
      ip_address: item.metadata?.ip_address ? String(item.metadata.ip_address) : undefined,
    }));
  }

  async loadAttachments(id: string): Promise<IncidentAttachment[]> {
    const response = await apiClient.get<{ attachments?: IncidentAttachmentResponse[] }>(`/incidents/${id}/`);
    return (response.data.attachments || []).map((attachment) => ({
      id: attachment.id,
      incident_id: id,
      filename: attachment.filename,
      file_url: attachment.file_url,
      file_size: attachment.file_size || 'Unknown',
      file_type: this.extractFileType(attachment.filename),
      uploaded_by: attachment.uploaded_by || {
        id: 'system',
        email: 'system',
        first_name: 'System',
        last_name: '',
        full_name: 'System',
        role: 'VIEWER',
        is_active: true,
      },
      uploaded_at: attachment.uploaded_at || new Date().toISOString(),
    }));
  }

  async loadComments(id: string): Promise<Comment[]> {
    const response = await apiClient.get<Comment[]>(`/incidents/${id}/comments/`);
    return response.data;
  }

  async loadRiskScore(id: string): Promise<RiskScoreMetrics> {
    const incident = await this.loadIncident(id);
    const analysisResponse = await apiClient.get<IncidentAnalysisPayload | null>(`/ai/incidents/${id}/analysis/`);
    const analysis = analysisResponse.data;
    const score = analysis?.risk_score ?? 0;
    const confidence = analysis?.confidence_score ?? 0;
    const severity = analysis?.severity_prediction || incident.severity;

    const normalizedSeverity = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(String(severity).toUpperCase())
      ? (String(severity).toUpperCase() as Incident['severity'])
      : incident.severity;

    return {
      incident_id: id,
      overall_score: score,
      trend: 'STABLE',
      severity: normalizedSeverity,
      color_indicator:
        normalizedSeverity === 'CRITICAL' ? 'red' : normalizedSeverity === 'HIGH' ? 'amber' : normalizedSeverity === 'MEDIUM' ? 'yellow' : 'green',
      ai_confidence: Math.round(confidence * 100),
      breakdown: score > 0
        ? [{ label: 'AI risk score', score, weight: 100 }]
        : [{ label: 'AI risk score unavailable', score: 0, weight: 100 }],
    };
  }

  async loadSystemMetadata(id: string): Promise<SystemMetadata> {
    const incident = await this.loadIncident(id);
    return {
      cluster_id: 'Not provided by incident telemetry',
      region: 'Not provided by incident telemetry',
      environment: 'PRODUCTION',
      kubernetes_namespace: incident.category ? `incident-${incident.category.toLowerCase()}` : 'Not provided',
      impacted_services: [],
      last_deployed_at: undefined,
    };
  }

  async postComment(id: string, message: string, _author: User): Promise<Comment> {
    const response = await apiClient.post<Comment>(`/incidents/${id}/comments/`, { message });
    return response.data;
  }

  async uploadAttachment(
    id: string,
    file: File,
    user: User,
    onProgress?: (progress: number) => void
  ): Promise<IncidentAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<IncidentAttachmentResponse>(`/incidents/${id}/attachments/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });

    return {
      id: response.data.id,
      incident_id: id,
      filename: response.data.filename,
      file_url: response.data.file_url,
      file_size: response.data.file_size || `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      file_type: this.extractFileType(file.name),
      uploaded_by: response.data.uploaded_by || user,
      uploaded_at: response.data.uploaded_at || new Date().toISOString(),
      upload_progress: 100,
    };
  }

  async updateStatus(id: string, status: Status): Promise<Incident> {
    const response = await apiClient.post<Incident>(`/incidents/${id}/status/`, { status });
    return response.data;
  }

  async assignIncident(id: string, assignee: User | null): Promise<Incident> {
    const response = await apiClient.post<Incident>(`/incidents/${id}/assign/`, {
      assigned_to_id: assignee ? assignee.id : null,
    });
    return response.data;
  }

  async triggerAIAnalyze(id: string): Promise<boolean> {
    const response = await apiClient.post<{ status?: string }>(`/ai/incidents/${id}/analyze/`);
    return response.status >= 200 && response.status < 300;
  }

  private normalizeAIStatus(value?: string): 'idle' | 'pending' | 'processing' | 'completed' | 'failed' {
    const status = value?.toLowerCase();
    if (status === 'pending' || status === 'processing' || status === 'completed' || status === 'failed') return status;
    return 'idle';
  }

  private extractFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || 'unknown';
    if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext)) return 'IMAGE';
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return 'DOCUMENT';
    if (['log', 'json', 'yaml', 'yml', 'xml', 'csv'].includes(ext)) return 'LOG_DATA';
    return 'FILE';
  }

  private mapEventTitle(type?: string): string {
    switch (type) {
      case 'CREATED': return 'Incident created';
      case 'STATUS_CHANGED': return 'Status changed';
      case 'SEVERITY_CHANGED': return 'Severity changed';
      case 'ASSIGNED': return 'Incident assigned';
      case 'COMMENT_ADDED': return 'Comment added';
      case 'AI_ANALYSIS_COMPLETED': return 'AI analysis completed';
      default: return 'Timeline event';
    }
  }

  private mapEventType(type?: string): IncidentTimelineItem['event_type'] {
    switch (type) {
      case 'CREATED':
      case 'STATUS_CHANGED':
      case 'SEVERITY_CHANGED':
      case 'ASSIGNED':
      case 'COMMENT_ADDED':
        return type;
      case 'AI_ANALYSIS_COMPLETED':
        return 'AI_ANALYSIS';
      default:
        return 'SYSTEM_ALERT';
    }
  }

  private mapEventIcon(type?: string): IncidentTimelineItem['icon_type'] {
    switch (type) {
      case 'CREATED': return 'alert';
      case 'ASSIGNED': return 'user';
      case 'COMMENT_ADDED': return 'comment';
      case 'AI_ANALYSIS_COMPLETED': return 'ai';
      case 'STATUS_CHANGED':
      case 'SEVERITY_CHANGED': return 'check';
      default: return 'system';
    }
  }
}

export const incidentWorkspaceService = new IncidentWorkspaceService();
