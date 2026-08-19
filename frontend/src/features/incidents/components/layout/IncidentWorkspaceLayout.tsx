import React from 'react';
import { useAuthStore } from '../../../../stores/useAuthStore';
import { useIncidentWorkspace } from '../../hooks/useIncidentWorkspace';
import { WorkspaceContent } from './WorkspaceContent';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceTabs } from './WorkspaceTabs';
import { IncidentCopilotPanel } from '../copilot/IncidentCopilotPanel';
import { incidentWorkspaceService } from '../../services/incidentWorkspaceService';

export interface IncidentWorkspaceLayoutProps {
  incidentId: string;
}

export const IncidentWorkspaceLayout: React.FC<IncidentWorkspaceLayoutProps> = React.memo(
  ({ incidentId }) => {
    const { user } = useAuthStore();
    const [isCopilotOpen, setIsCopilotOpen] = React.useState(false);
    const {
      incident,
      timeline,
      comments,
      attachments,
      auditTrail,
      riskScore,
      systemMetadata,
      rootCause,
      recommendations,
      similarIncidents,
      aiStatus,
      selectedTab,
      pollingEnabled,
      isRefreshing,
      lastUpdated,
      loading,
      errors,
      setSelectedTab,
      addComment,
      uploadAttachment,
      updateStatus,
      assignIncident,
      togglePolling,
      manualRefresh,
    } = useIncidentWorkspace(incidentId);

    const triggerAnalysis = () => {
      void incidentWorkspaceService.triggerAIAnalyze(incidentId);
      manualRefresh();
    };

    return (
      <div className="w-full min-w-0 space-y-4 overflow-x-clip pb-6 sm:space-y-5 lg:space-y-6">
        <WorkspaceHeader
          incident={incident}
          pollingEnabled={pollingEnabled}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          aiStatus={aiStatus}
          isCopilotOpen={isCopilotOpen}
          onTogglePolling={togglePolling}
          onManualRefresh={manualRefresh}
          onStartAnalysis={triggerAnalysis}
          onToggleCopilot={() => setIsCopilotOpen((open) => !open)}
        />

        <WorkspaceTabs
          selectedTab={selectedTab}
          onSelectTab={setSelectedTab}
          timelineCount={timeline.length}
          recommendationsCount={recommendations.length}
          similarCount={similarIncidents.length}
          commentsCount={comments.length}
          attachmentsCount={attachments.length}
          auditCount={auditTrail.length}
        />

        <div className="relative w-full min-w-0">
          <div className={`w-full min-w-0 transition-[padding] duration-300 ${isCopilotOpen ? 'xl:pr-[420px]' : ''}`}>
            <div className="grid w-full min-w-0 grid-cols-1 items-start gap-4 md:gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
              <main className="min-w-0">
                <WorkspaceContent
                  selectedTab={selectedTab}
                  incident={incident}
                  timeline={timeline}
                  rootCause={rootCause}
                  recommendations={recommendations}
                  similarIncidents={similarIncidents}
                  comments={comments}
                  attachments={attachments}
                  auditTrail={auditTrail}
                  currentUser={user}
                  onPostComment={addComment}
                  onUploadAttachment={uploadAttachment}
                  isLoadingIncident={loading.incident}
                  incidentError={errors.incident}
                  aiStatus={aiStatus}
                  onRetryAnalysis={triggerAnalysis}
                />
              </main>

              <aside className="min-w-0 xl:sticky xl:top-5">
                <WorkspaceSidebar
                  incident={incident}
                  riskScore={riskScore}
                  systemMetadata={systemMetadata}
                  currentUser={user}
                  onUpdateStatus={updateStatus}
                  onAssignIncident={assignIncident}
                />
              </aside>
            </div>
          </div>

          {isCopilotOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                onClick={() => setIsCopilotOpen(false)}
                aria-hidden="true"
              />
              <div className="fixed inset-y-0 right-0 z-50 w-full border-l border-zinc-800 bg-zinc-950 shadow-2xl sm:w-[420px] xl:w-[400px]">
                <div className="h-full w-full pt-[60px] lg:pt-0">
                  <IncidentCopilotPanel
                    incident={incident}
                    onClose={() => setIsCopilotOpen(false)}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

IncidentWorkspaceLayout.displayName = 'IncidentWorkspaceLayout';
