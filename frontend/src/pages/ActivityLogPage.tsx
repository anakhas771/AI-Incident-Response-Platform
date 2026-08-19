import React, { useEffect, useMemo } from 'react';
import { Activity, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../stores/useIncidentStore';

interface ActivityRow {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'INCIDENT';
  incidentId: string;
}

export const ActivityLogPage: React.FC = () => {
  const navigate = useNavigate();
  const incidents = useIncidentStore((state) => state.incidents);
  const loadIncidents = useIncidentStore((state) => state.loadIncidents);

  useEffect(() => {
    void loadIncidents();
    const interval = window.setInterval(() => {
      void loadIncidents();
    }, 10000);
    return () => window.clearInterval(interval);
  }, [loadIncidents]);

  const rows = useMemo<ActivityRow[]>(() => {
    const activity: ActivityRow[] = [];

    for (const incident of incidents) {
      activity.push({
        id: `created-${incident.id}`,
        actor: incident.created_by?.full_name || incident.created_by?.email || 'Unknown user',
        action: 'Created incident',
        target: incident.title,
        timestamp: incident.created_at,
        type: 'INCIDENT',
        incidentId: incident.id,
      });

      if (incident.updated_at && incident.updated_at !== incident.created_at) {
        activity.push({
          id: `updated-${incident.id}`,
          actor:
            incident.assigned_to?.full_name ||
            incident.created_by?.full_name ||
            'Organization member',
          action: `Incident currently ${incident.status}`,
          target: incident.title,
          timestamp: incident.updated_at,
          type: 'INCIDENT',
          incidentId: incident.id,
        });
      }
    }

    return activity.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  }, [incidents]);

  return (
    <div className="min-w-0 space-y-6">
      <div className="min-w-0">
        <h1 className="flex min-w-0 items-center gap-2 text-xl font-bold tracking-tight text-zinc-100">
          <Activity className="h-5 w-5 shrink-0 text-cyan-400" />
          <span className="break-words">Organization Activity</span>
        </h1>
        <p className="mt-0.5 text-xs text-zinc-400">
          Live activity derived from real incident records. No demo audit entries are shown.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-subtle bg-surface p-8 text-center">
          <Activity className="mx-auto h-8 w-8 text-zinc-600" />
          <h2 className="mt-3 text-sm font-semibold text-zinc-200">No activity yet</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Incident creation and updates will appear here as your organization uses the platform.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-subtle bg-surface shadow-xl">
          <div className="divide-y divide-subtle">
            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => navigate(`/incidents/${row.incidentId}`)}
                className="flex w-full min-w-0 flex-col gap-3 p-4 text-left transition-colors hover:bg-surface-elevated/50 sm:grid sm:grid-cols-[minmax(10rem,1fr)_minmax(12rem,1.4fr)_minmax(12rem,1.7fr)_auto] sm:items-center sm:gap-4"
              >
                <span className="min-w-0 break-words text-xs font-medium text-zinc-100">
                  {row.actor}
                </span>
                <span className="min-w-0 break-words font-mono text-[11px] text-zinc-300">
                  {row.action}
                </span>
                <span className="min-w-0 break-words text-xs text-indigo-300">{row.target}</span>
                <span className="flex items-center justify-between gap-3 text-[11px] font-mono text-zinc-500 sm:block sm:text-right">
                  <span>{new Date(row.timestamp).toLocaleString()}</span>
                  <ArrowUpRight className="inline h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogPage;
