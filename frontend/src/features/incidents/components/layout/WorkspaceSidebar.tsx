import React from 'react';
import { Incident, Status, User } from '../../../../types';
import { RiskScoreMetrics, SystemMetadata } from '../../types';
import { RiskScoreWidget } from '../RiskScoreWidget';
import { SystemMetadataPanel } from '../SystemMetadataPanel';
import { WorkspaceToolbar } from './WorkspaceToolbar';

export interface WorkspaceSidebarProps {
  incident: Incident | null;
  riskScore: RiskScoreMetrics | null;
  systemMetadata: SystemMetadata | null;
  currentUser: User | null;
  onUpdateStatus: (status: Status, user: User) => Promise<void>;
  onAssignIncident: (assignee: User | null, user: User) => Promise<void>;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = React.memo(
  ({ incident, riskScore, systemMetadata, currentUser, onUpdateStatus, onAssignIncident }) => {
    return (
      <aside aria-label="Incident Telemetry Sidebar" className="space-y-6">
        <RiskScoreWidget metrics={riskScore} />

        <WorkspaceToolbar
          incident={incident}
          currentUser={currentUser}
          onUpdateStatus={onUpdateStatus}
          onAssignIncident={onAssignIncident}
        />

        <SystemMetadataPanel metadata={systemMetadata} />
      </aside>
    );
  }
);

WorkspaceSidebar.displayName = 'WorkspaceSidebar';
