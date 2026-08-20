import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIncidentWorkspaceStore } from '../state/useIncidentWorkspaceStore';
import { mockIncidents, mockUsers } from '../../../services/mockData';
import { incidentWorkspaceService } from '../services/incidentWorkspaceService';

vi.mock('../services/incidentWorkspaceService', () => ({
  incidentWorkspaceService: {
    postComment: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

describe('useIncidentWorkspaceStore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useIncidentWorkspaceStore.getState().resetWorkspaceData();
  });

  it('initializes with default empty workspace state', () => {
    const state = useIncidentWorkspaceStore.getState();

    expect(state.currentIncident).toBeNull();
    expect(state.timeline).toEqual([]);
    expect(state.comments).toEqual([]);
    expect(state.attachments).toEqual([]);
    expect(state.auditTrail).toEqual([]);
    expect(state.riskScore).toBeNull();
    expect(state.systemMetadata).toBeNull();
  });

  it('updates current incident state', () => {
    const incident = mockIncidents[0];

    useIncidentWorkspaceStore.getState().setIncident(incident);

    expect(useIncidentWorkspaceStore.getState().currentIncident).toEqual(incident);
  });

  it('adds comment and updates timeline and audit trail state', async () => {
    const incident = mockIncidents[0];
    const user = mockUsers[0];

    vi.mocked(incidentWorkspaceService.postComment).mockResolvedValueOnce({
      id: 'comment-test-1',
      incident_id: incident.id,
      author: user,
      message: 'Test comment',
      created_at: '2026-08-20T10:00:00Z',
    });

    useIncidentWorkspaceStore.getState().setIncident(incident);

    await useIncidentWorkspaceStore.getState().addComment('Test comment', user);

    const state = useIncidentWorkspaceStore.getState();

    expect(incidentWorkspaceService.postComment).toHaveBeenCalledWith(
      incident.id,
      'Test comment',
      user
    );

    expect(state.comments).toHaveLength(1);
    expect(state.comments[0].message).toBe('Test comment');
    expect(state.timeline).toHaveLength(1);
    expect(state.timeline[0].event_type).toBe('COMMENT_ADDED');
    expect(state.auditTrail).toHaveLength(1);
  });

  it('updates incident status and records audit log', async () => {
    const incident = mockIncidents[0];
    const user = mockUsers[0];

    vi.mocked(incidentWorkspaceService.updateStatus).mockResolvedValueOnce({
      ...incident,
      status: 'RESOLVED',
    });

    useIncidentWorkspaceStore.getState().setIncident(incident);

    await useIncidentWorkspaceStore.getState().updateStatus('RESOLVED', user);

    const state = useIncidentWorkspaceStore.getState();

    expect(incidentWorkspaceService.updateStatus).toHaveBeenCalledWith(incident.id, 'RESOLVED');

    expect(state.currentIncident?.status).toBe('RESOLVED');
    expect(state.timeline).toHaveLength(1);
    expect(state.timeline[0].event_type).toBe('STATUS_CHANGED');
    expect(state.auditTrail).toHaveLength(1);
    expect(state.auditTrail[0].action_type).toBe('STATUS_CHANGE');
  });
});
