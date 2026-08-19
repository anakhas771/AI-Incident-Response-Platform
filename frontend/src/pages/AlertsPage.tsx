import React, { useEffect, useMemo } from 'react';
import { Bell, Radio, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { useIncidentStore } from '../stores/useIncidentStore';
import { Incident } from '../types';

interface AlertItem {
  id: string;
  incident: Incident;
  severity: Incident['severity'];
  timestamp: string;
}

const ACTIVE_STATUSES = new Set(['OPEN', 'INVESTIGATING', 'IDENTIFIED', 'MITIGATING']);
const ALERT_SEVERITIES = new Set(['CRITICAL', 'HIGH']);

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const incidents = useIncidentStore((state) => state.incidents);
  const loadIncidents = useIncidentStore((state) => state.loadIncidents);

  useEffect(() => {
    void loadIncidents();
    const interval = window.setInterval(() => {
      void loadIncidents();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [loadIncidents]);

  const alerts = useMemo<AlertItem[]>(
    () =>
      incidents
        .filter(
          (incident) =>
            ALERT_SEVERITIES.has(incident.severity) && ACTIVE_STATUSES.has(incident.status)
        )
        .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
        .map((incident) => ({
          id: `incident-${incident.id}`,
          incident,
          severity: incident.severity,
          timestamp: incident.updated_at || incident.created_at,
        })),
    [incidents]
  );

  const handleOpen = (incident: Incident) => {
    navigate(`/incidents/${incident.id}`);
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="flex min-w-0 items-center gap-2 text-xl font-bold tracking-tight text-zinc-100">
            <Bell className="h-5 w-5 shrink-0 text-indigo-400" />
            <span className="min-w-0 break-words">Real-time Incident Alerts</span>
          </h1>
          <p className="mt-0.5 text-xs text-zinc-400">
            Live HIGH and CRITICAL incidents from your organization, refreshed every 5 seconds.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Live
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-subtle bg-surface p-8 text-center">
          <Bell className="mx-auto h-8 w-8 text-zinc-600" />
          <h2 className="mt-3 text-sm font-semibold text-zinc-200">No active alerts</h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-zinc-500">
            New HIGH and CRITICAL incidents will appear here automatically when they are created in your organization.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-subtle bg-surface shadow-xl">
          <div className="divide-y divide-subtle">
            {alerts.map((alert) => {
              const incident = alert.incident;
              return (
                <article
                  key={alert.id}
                  className="flex min-w-0 flex-col gap-4 p-4 transition-colors hover:bg-surface-elevated/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="shrink-0 rounded-lg border border-red-800/40 bg-red-950/40 p-2 text-red-400">
                      <Radio className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-zinc-200">{incident.category}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="break-all text-zinc-500">{incident.id}</span>
                      </div>
                      <h3 className="mt-1 break-words text-sm font-semibold text-zinc-100">
                        {incident.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-zinc-500">
                        {incident.description}
                      </p>
                      <p className="mt-1 text-[11px] font-mono text-zinc-600">
                        Updated {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:pl-4">
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                        alert.severity === 'CRITICAL'
                          ? 'border-red-800 bg-red-950 text-red-400'
                          : 'border-orange-800 bg-orange-950 text-orange-400'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-mono uppercase text-zinc-400">
                      {incident.status}
                    </span>
                    <Button size="sm" variant="secondary" onClick={() => handleOpen(incident)}>
                      Open
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
