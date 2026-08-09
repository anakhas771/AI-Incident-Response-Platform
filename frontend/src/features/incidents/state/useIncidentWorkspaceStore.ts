import { create } from 'zustand';
import { Comment, Incident, Status, User } from '../../../types';
import { incidentWorkspaceService } from '../services/incidentWorkspaceService';
import {
  IncidentAttachment,
  IncidentAuditLog,
  IncidentTimelineItem,
  RiskScoreMetrics,
  SystemMetadata,
} from '../types';

export interface IncidentWorkspaceStoreState {
  currentIncident: Incident | null;
  timeline: IncidentTimelineItem[];
  comments: Comment[];
  attachments: IncidentAttachment[];
  auditTrail: IncidentAuditLog[];
  riskScore: RiskScoreMetrics | null;
  systemMetadata: SystemMetadata | null;

  setIncident: (incident: Incident | null) => void;
  setTimeline: (timeline: IncidentTimelineItem[]) => void;
  setComments: (comments: Comment[]) => void;
  setAttachments: (attachments: IncidentAttachment[]) => void;
  setAuditTrail: (audit: IncidentAuditLog[]) => void;
  setRiskScore: (risk: RiskScoreMetrics | null) => void;
  setSystemMetadata: (metadata: SystemMetadata | null) => void;

  addComment: (message: string, author: User) => Promise<void>;
  uploadAttachment: (file: File, user: User) => Promise<void>;
  updateStatus: (status: Status, user: User) => Promise<void>;
  assignIncident: (assignee: User | null, user: User) => Promise<void>;
  resetWorkspaceData: () => void;
}

export const useIncidentWorkspaceStore = create<IncidentWorkspaceStoreState>((set, get) => ({
  currentIncident: null,
  timeline: [],
  comments: [],
  attachments: [],
  auditTrail: [],
  riskScore: null,
  systemMetadata: null,

  setIncident: (incident) => set({ currentIncident: incident }),
  setTimeline: (timeline) => set({ timeline }),
  setComments: (comments) => set({ comments }),
  setAttachments: (attachments) => set({ attachments }),
  setAuditTrail: (auditTrail) => set({ auditTrail }),
  setRiskScore: (riskScore) => set({ riskScore }),
  setSystemMetadata: (systemMetadata) => set({ systemMetadata }),

  addComment: async (message: string, author: User) => {
    const { currentIncident, comments, timeline, auditTrail } = get();
    if (!currentIncident) return;

    try {
      const newComment = await incidentWorkspaceService.postComment(
        currentIncident.id,
        message,
        author
      );

      const newTimelineItem: IncidentTimelineItem = {
        id: `tl-comm-${Date.now()}`,
        incident_id: currentIncident.id,
        event_type: 'COMMENT_ADDED',
        title: 'Analyst Comment Posted',
        message: message,
        actor: author,
        timestamp: new Date().toISOString(),
        icon_type: 'comment',
      };

      const newAuditItem: IncidentAuditLog = {
        id: `audit-comm-${Date.now()}`,
        incident_id: currentIncident.id,
        timestamp: new Date().toISOString(),
        action_type: 'COMMENT_POSTED',
        description: `Comment posted by ${author.full_name}`,
        actor: author,
      };

      set({
        comments: [...comments, newComment],
        timeline: [newTimelineItem, ...timeline],
        auditTrail: [newAuditItem, ...auditTrail],
      });
    } catch (err) {
      console.error('[useIncidentWorkspaceStore] Failed to post comment:', err);
    }
  },

  uploadAttachment: async (file: File, user: User) => {
    const { currentIncident, attachments, timeline, auditTrail } = get();
    if (!currentIncident) return;

    try {
      const newAttachment = await incidentWorkspaceService.uploadAttachment(
        currentIncident.id,
        file,
        user
      );

      const newTimelineItem: IncidentTimelineItem = {
        id: `tl-att-${Date.now()}`,
        incident_id: currentIncident.id,
        event_type: 'ATTACHMENT',
        title: 'Attachment Uploaded',
        message: `File uploaded: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
        actor: user,
        timestamp: new Date().toISOString(),
        icon_type: 'attachment',
      };

      const newAuditItem: IncidentAuditLog = {
        id: `audit-att-${Date.now()}`,
        incident_id: currentIncident.id,
        timestamp: new Date().toISOString(),
        action_type: 'ATTACHMENT_UPLOADED',
        description: `Attachment '${file.name}' uploaded by ${user.full_name}`,
        actor: user,
      };

      set({
        attachments: [newAttachment, ...attachments],
        timeline: [newTimelineItem, ...timeline],
        auditTrail: [newAuditItem, ...auditTrail],
      });
    } catch (err) {
      console.error('[useIncidentWorkspaceStore] Failed to upload attachment:', err);
    }
  },

  updateStatus: async (status: Status, user: User) => {
    const { currentIncident, timeline, auditTrail } = get();
    if (!currentIncident) return;

    const oldStatus = currentIncident.status;
    try {
      const updated = await incidentWorkspaceService.updateStatus(currentIncident.id, status);

      const newTimelineItem: IncidentTimelineItem = {
        id: `tl-stat-${Date.now()}`,
        incident_id: currentIncident.id,
        event_type: 'STATUS_CHANGED',
        title: `Status Changed to ${status}`,
        message: `Incident status transitioned from ${oldStatus} to ${status}.`,
        actor: user,
        timestamp: new Date().toISOString(),
        icon_type: 'check',
      };

      const newAuditItem: IncidentAuditLog = {
        id: `audit-stat-${Date.now()}`,
        incident_id: currentIncident.id,
        timestamp: new Date().toISOString(),
        action_type: 'STATUS_CHANGE',
        description: `Status changed from ${oldStatus} to ${status}`,
        actor: user,
        old_value: oldStatus,
        new_value: status,
      };

      set({
        currentIncident: updated,
        timeline: [newTimelineItem, ...timeline],
        auditTrail: [newAuditItem, ...auditTrail],
      });
    } catch (err) {
      console.error('[useIncidentWorkspaceStore] Failed to update status:', err);
    }
  },

  assignIncident: async (assignee: User | null, user: User) => {
    const { currentIncident, timeline, auditTrail } = get();
    if (!currentIncident) return;

    const oldAssignee = currentIncident.assigned_to?.full_name || 'Unassigned';
    const newAssignee = assignee?.full_name || 'Unassigned';

    try {
      const updated = await incidentWorkspaceService.assignIncident(currentIncident.id, assignee);

      const newTimelineItem: IncidentTimelineItem = {
        id: `tl-ass-${Date.now()}`,
        incident_id: currentIncident.id,
        event_type: 'ASSIGNED',
        title: 'Incident Reassigned',
        message: `Assigned to ${newAssignee} (previously ${oldAssignee}).`,
        actor: user,
        timestamp: new Date().toISOString(),
        icon_type: 'user',
      };

      const newAuditItem: IncidentAuditLog = {
        id: `audit-ass-${Date.now()}`,
        incident_id: currentIncident.id,
        timestamp: new Date().toISOString(),
        action_type: 'ASSIGNMENT_CHANGE',
        description: `Assignee changed from ${oldAssignee} to ${newAssignee}`,
        actor: user,
        old_value: oldAssignee,
        new_value: newAssignee,
      };

      set({
        currentIncident: updated,
        timeline: [newTimelineItem, ...timeline],
        auditTrail: [newAuditItem, ...auditTrail],
      });
    } catch (err) {
      console.error('[useIncidentWorkspaceStore] Failed to reassign incident:', err);
    }
  },

  resetWorkspaceData: () => {
    set({
      currentIncident: null,
      timeline: [],
      comments: [],
      attachments: [],
      auditTrail: [],
      riskScore: null,
      systemMetadata: null,
    });
  },
}));
