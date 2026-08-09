import React from 'react';
import { Incident, Status, User } from '../../../../types';
import { mockUsers } from '../../../../services/mockData';

export interface WorkspaceToolbarProps {
  incident: Incident | null;
  currentUser: User | null;
  onUpdateStatus: (status: Status, user: User) => Promise<void>;
  onAssignIncident: (assignee: User | null, user: User) => Promise<void>;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = React.memo(
  ({ incident, currentUser, onUpdateStatus, onAssignIncident }) => {
    if (!incident) return null;

    const handleStatusChange = (newStatus: Status) => {
      if (!currentUser) return;
      onUpdateStatus(newStatus, currentUser);
    };

    const handleAssigneeChange = (userId: string) => {
      if (!currentUser) return;
      const assignee = mockUsers.find((u) => u.id === userId) || null;
      onAssignIncident(assignee, currentUser);
    };

    return (
      <div className="bg-surface border border-subtle rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Response Management Controls
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
              Transition Status
            </label>
            <select
              value={incident.status}
              onChange={(e) => handleStatusChange(e.target.value as Status)}
              aria-label="Transition incident status"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="OPEN">OPEN (Needs Triage)</option>
              <option value="INVESTIGATING">INVESTIGATING (Under Analysis)</option>
              <option value="IDENTIFIED">IDENTIFIED (Root Cause Found)</option>
              <option value="MITIGATING">MITIGATING (Fix Applied)</option>
              <option value="RESOLVED">RESOLVED (Normal Ops)</option>
              <option value="CLOSED">CLOSED (Archived)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
              Assign Incident Owner
            </label>
            <select
              value={incident.assigned_to?.id || ''}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              aria-label="Assign incident owner"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">Unassigned</option>
              {mockUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }
);

WorkspaceToolbar.displayName = 'WorkspaceToolbar';
