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

    return (
      <div className="space-y-6">
        {/* Header Navigation & Live Polling Status */}
        <WorkspaceHeader
          incident={incident}
          pollingEnabled={pollingEnabled}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          aiStatus={aiStatus}
          isCopilotOpen={isCopilotOpen}
          onTogglePolling={togglePolling}
          onManualRefresh={manualRefresh}
          onStartAnalysis={() => {
            incidentWorkspaceService.triggerAIAnalyze(incidentId);
            manualRefresh();
          }}
          onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
        />

        {/* Tab Navigation Bar */}
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

        {/* Multi-Panel Grid Layout with optional Copilot Drawer */}
        <div className="relative flex overflow-hidden w-full items-start gap-6">
          <div
            className={`flex-1 min-w-0 transition-all duration-300 ${isCopilotOpen ? 'mr-0 lg:mr-[400px]' : ''}`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Feed Content */}
              <main className="lg:col-span-8">
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
                  onRetryAnalysis={() => {
                    incidentWorkspaceService.triggerAIAnalyze(incidentId);
                    manualRefresh();
                  }}
                />
              </main>

              {/* SOC Telemetry & Response Controls Sidebar */}
              <div className="lg:col-span-4">
                <WorkspaceSidebar
                  incident={incident}
                  riskScore={riskScore}
                  systemMetadata={systemMetadata}
                  currentUser={user}
                  onUpdateStatus={updateStatus}
                  onAssignIncident={assignIncident}
                />
              </div>
            </div>
          </div>

          {/* Copilot Drawer */}
          {isCopilotOpen && (
            <>
              {/* Mobile overlay */}
              <div
                className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                onClick={() => setIsCopilotOpen(false)}
              />
              {/* Drawer Container */}
              <div className="fixed inset-y-0 right-0 z-50 w-full lg:w-[400px] bg-zinc-950 border-l border-zinc-800 shadow-2xl transition-transform transform translate-x-0 lg:mt-0 pt-[60px] lg:pt-0">
                <div className="h-full w-full">
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
