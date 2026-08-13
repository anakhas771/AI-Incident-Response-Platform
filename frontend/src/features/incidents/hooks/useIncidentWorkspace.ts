import { useCallback, useEffect } from 'react';
import { incidentWorkspaceService } from '../services/incidentWorkspaceService';
import { defaultRefreshManager, RefreshManager } from '../services/RefreshManager';
import {
  useIncidentAIStore,
  useIncidentPollingStore,
  useIncidentUIStore,
  useIncidentWorkspaceStore,
} from '../state';

export interface UseIncidentWorkspaceOptions {
  refreshManager?: RefreshManager;
}

export function useIncidentWorkspace(incidentId: string, options?: UseIncidentWorkspaceOptions) {
  const manager = options?.refreshManager || defaultRefreshManager;

  const workspaceStore = useIncidentWorkspaceStore();
  const aiStore = useIncidentAIStore();
  const uiStore = useIncidentUIStore();
  const pollingStore = useIncidentPollingStore();

  const loadAll = useCallback(async (id: string, isSilent: boolean = false) => {
    const uiState = useIncidentUIStore.getState();
    const pollingState = useIncidentPollingStore.getState();
    const workspaceState = useIncidentWorkspaceStore.getState();
    const aiState = useIncidentAIStore.getState();

    if (!isSilent) {
      uiState.setLoading({
        incident: true,
        timeline: true,
        recommendations: true,
        rca: true,
        similar: true,
        audit: true,
        attachments: true,
        comments: true,
        riskScore: true,
        systemMetadata: true,
      });
    }
    pollingState.setIsRefreshing(true);

    try {
      const results = await Promise.allSettled([
        incidentWorkspaceService.loadIncident(id),
        incidentWorkspaceService.loadTimeline(id),
        incidentWorkspaceService.loadAIAnalysis(id),
        incidentWorkspaceService.loadAuditTrail(id),
        incidentWorkspaceService.loadAttachments(id),
        incidentWorkspaceService.loadComments(id),
        incidentWorkspaceService.loadRiskScore(id),
        incidentWorkspaceService.loadSystemMetadata(id),
      ]);

      const [incidentRes, timelineRes, aiRes, auditRes, attRes, commentsRes, riskRes, sysRes] =
        results;

      if (incidentRes.status === 'fulfilled') workspaceState.setIncident(incidentRes.value);
      if (timelineRes.status === 'fulfilled') workspaceState.setTimeline(timelineRes.value);
      if (aiRes.status === 'fulfilled') {
        const { status, summary, rca, recommendations, similarIncidents } = aiRes.value;
        aiState.setStatus(status);
        aiState.setSummary(summary);
        aiState.setRootCause(rca);
        aiState.setRecommendations(recommendations);
        aiState.setSimilarIncidents(similarIncidents);

        // Auto-stop polling if AI is completed or failed
        if (status === 'completed' || status === 'failed') {
          if (pollingState.enabled) {
            pollingState.togglePolling(); // This turns it off
          }
        }
      }
      if (auditRes.status === 'fulfilled') workspaceState.setAuditTrail(auditRes.value);
      if (attRes.status === 'fulfilled') workspaceState.setAttachments(attRes.value);
      if (commentsRes.status === 'fulfilled') workspaceState.setComments(commentsRes.value);
      if (riskRes.status === 'fulfilled') workspaceState.setRiskScore(riskRes.value);
      if (sysRes.status === 'fulfilled') workspaceState.setSystemMetadata(sysRes.value);

      uiState.setError({
        incident: incidentRes.status === 'rejected' ? 'Failed to load incident details' : null,
        timeline: timelineRes.status === 'rejected' ? 'Failed to load timeline' : null,
        recommendations: aiRes.status === 'rejected' ? 'Failed to load recommendations' : null,
        rca: aiRes.status === 'rejected' ? 'Failed to load RCA' : null,
        similar: aiRes.status === 'rejected' ? 'Failed to load similar incidents' : null,
        audit: auditRes.status === 'rejected' ? 'Failed to load audit trail' : null,
        attachments: attRes.status === 'rejected' ? 'Failed to load attachments' : null,
        comments: commentsRes.status === 'rejected' ? 'Failed to load comments' : null,
        riskScore: riskRes.status === 'rejected' ? 'Failed to load risk score' : null,
        systemMetadata: sysRes.status === 'rejected' ? 'Failed to load system metadata' : null,
      });

      pollingState.setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      if (!isSilent) {
        uiState.setLoading({
          incident: false,
          timeline: false,
          recommendations: false,
          rca: false,
          similar: false,
          audit: false,
          attachments: false,
          comments: false,
          riskScore: false,
          systemMetadata: false,
        });
      }
      pollingState.setIsRefreshing(false);
    }
  }, []);

  // Sync background polling with RefreshManager
  useEffect(() => {
    if (!incidentId) return;

    // Clear old state before loading new incident
    useIncidentWorkspaceStore.getState().resetWorkspaceData();
    useIncidentAIStore.getState().resetAIState();

    loadAll(incidentId, false);

    const unsubscribe = manager.subscribe(async (id) => {
      await loadAll(id, true);
    });

    const pollingState = useIncidentPollingStore.getState();

    if (pollingState.enabled) {
      manager.start(incidentId, pollingState.intervalMs);
    } else {
      manager.stop();
    }

    return () => {
      unsubscribe();
      manager.stop();

      const currentPollingState = useIncidentPollingStore.getState();

      if (currentPollingState.enabled) {
        currentPollingState.togglePolling();
      }
    };
  }, [incidentId, manager, loadAll]);

  const togglePolling = useCallback(() => {
    useIncidentPollingStore.getState().togglePolling();
  }, []);

  const manualRefresh = useCallback(() => {
    if (incidentId) {
      loadAll(incidentId, false);
    }
  }, [incidentId, loadAll]);

  return {
    // Stores
    incident: workspaceStore.currentIncident,
    timeline: workspaceStore.timeline,
    comments: workspaceStore.comments,
    attachments: workspaceStore.attachments,
    auditTrail: workspaceStore.auditTrail,
    riskScore: workspaceStore.riskScore,
    systemMetadata: workspaceStore.systemMetadata,

    rootCause: aiStore.rootCause,
    recommendations: aiStore.recommendations,
    similarIncidents: aiStore.similarIncidents,
    aiStatus: aiStore.status,
    aiSummary: aiStore.summary,

    selectedTab: uiStore.selectedTab,
    filters: uiStore.filters,
    loading: uiStore.loading,
    errors: uiStore.errors,

    pollingEnabled: pollingStore.enabled,
    isRefreshing: pollingStore.isRefreshing,
    lastUpdated: pollingStore.lastUpdated,

    // Actions
    setSelectedTab: uiStore.setSelectedTab,
    setFilters: uiStore.setFilters,
    addComment: workspaceStore.addComment,
    uploadAttachment: workspaceStore.uploadAttachment,
    updateStatus: workspaceStore.updateStatus,
    assignIncident: workspaceStore.assignIncident,
    togglePolling,
    manualRefresh,
  };
}
