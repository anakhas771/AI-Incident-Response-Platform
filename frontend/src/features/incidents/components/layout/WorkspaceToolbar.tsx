import React from 'react';
import { useEffect, useState } from 'react';
import { Incident, Status, User } from '../../../../types';
import apiClient from '../../../../api/client';

export interface WorkspaceToolbarProps {
  incident: Incident | null;
  currentUser: User | null;
  onUpdateStatus: (status: Status, user: User) => Promise<void>;
  onAssignIncident: (assignee: User | null, user: User) => Promise<void>;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = React.memo(
  ({ incident, currentUser, onUpdateStatus, onAssignIncident }) => {
    const [members, setMembers] = useState<User[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);

    useEffect(() => {
      let cancelled = false;

      const loadMembers = async () => {
        setMembersLoading(true);
        try {
          const response = await apiClient.get<User[]>('/auth/organization/members/');
          if (!cancelled) setMembers(Array.isArray(response.data) ? response.data : []);
        } catch {
          if (!cancelled) setMembers([]);
        } finally {
          if (!cancelled) setMembersLoading(false);
        }
      };

      void loadMembers();
      return () => {
        cancelled = true;
      };
    }, []);

    if (!incident) return null;

    const handleStatusChange = (newStatus: Status) => {
      if (!currentUser) return;
      void onUpdateStatus(newStatus, currentUser);
    };

    const handleAssigneeChange = (userId: string) => {
      if (!currentUser) return;
      const assignee = members.find((member) => member.id === userId) || null;
      void onAssignIncident(assignee, currentUser);
    };

    return (
      <div className="rounded-xl border border-subtle bg-surface/60 p-4 sm:p-5 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Response Management
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <label className="mb-1 block text-[11px] font-mono uppercase text-zinc-400">
              Transition Status
            </label>
            <select
              value={incident.status}
              onChange={(e) => handleStatusChange(e.target.value as Status)}
              aria-label="Transition incident status"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono font-semibold text-zinc-100 outline-none transition-colors focus:border-indigo-500"
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
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-[11px] font-mono uppercase text-zinc-400">
                Assign Incident Owner
              </label>
              <span className="text-[10px] text-zinc-600">
                {membersLoading ? 'Loading members…' : `${members.length} org member${members.length === 1 ? '' : 's'}`}
              </span>
            </div>
            <select
              value={incident.assigned_to?.id || ''}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              aria-label="Assign incident owner"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-100 outline-none transition-colors focus:border-indigo-500"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name || member.email} ({member.role})
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
