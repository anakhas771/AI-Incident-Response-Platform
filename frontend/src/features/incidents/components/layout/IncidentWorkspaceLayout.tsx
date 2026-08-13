import React from 'react';
import { useAuthStore } from '../../../../stores/useAuthStore';
import { useIncidentWorkspace } from '../../hooks/useIncidentWorkspace';
import { WorkspaceContent } from './WorkspaceContent';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceTabs } from './WorkspaceTabs';

export interface IncidentWorkspaceLayoutProps {
  incidentId: string;
}

export const IncidentWorkspaceLayout: React.FC<IncidentWorkspaceLayoutProps> = React.memo(
  ({ incidentId }) => {
    const { user } = useAuthStore();
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
      selectedTab,
      pollingEnabled,
      isRefreshing,
      lastUpdated,
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
          onTogglePolling={togglePolling}
          onManualRefresh={manualRefresh}
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

        {/* Multi-Panel Grid Layout */}
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
    );
  }
);

IncidentWorkspaceLayout.displayName = 'IncidentWorkspaceLayout';
