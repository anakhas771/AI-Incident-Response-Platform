import React, { useEffect, useMemo } from 'react';
import { Bell, Radio, ArrowUpRight, ShieldAlert, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { useIncidentStore } from '../stores/useIncidentStore';
import { Incident } from '../types';
import { SeverityBadge, StatusBadge } from '../components/ui/Badge';
import { cn } from '../utils/cn';

interface AlertItem {
  id: string;
  incident: Incident;
  severity: Incident['severity'];
  timestamp: string;
}

const ACTIVE_STATUSES = new Set(['OPEN', 'INVESTIGATING', 'IDENTIFIED', 'MITIGATING']);
const ALERT_SEVERITIES = new Set(['CRITICAL', 'HIGH']);

function formatRelativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatElapsed(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '< 1m';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  const rem = min % 60;
  return rem > 0 ? `${hr}h ${rem}m` : `${hr}h`;
}

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
        .sort((a, b) => {
          // CRITICAL before HIGH, then by recency
          if (a.severity !== b.severity) {
            return a.severity === 'CRITICAL' ? -1 : 1;
          }
          return +new Date(b.updated_at) - +new Date(a.updated_at);
        })
        .map((incident) => ({
          id: `incident-${incident.id}`,
          incident,
          severity: incident.severity,
          timestamp: incident.updated_at || incident.created_at,
        })),
    [incidents]
  );

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH').length;

  const handleOpen = (incident: Incident) => {
    navigate(`/incidents/${incident.id}`);
  };

  const handleAcknowledge = (incident: Incident, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success(`Alert acknowledged: ${incident.title.slice(0, 40)}...`);
  };

  return (
    <div className="min-w-0 space-y-5">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-red-400/70">
            <Radio className="h-3 w-3" />
            Real-time Alert Center
          </div>
          <h1 className="flex min-w-0 items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Active Alerts
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Live HIGH and CRITICAL incidents from your organization, refreshed every 5 seconds.
          </p>
        </div>

        {/* Summary chips */}
        {alerts.length > 0 && (
          <div className="flex shrink-0 items-center gap-2">
            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/[0.07] px-3 py-1.5 text-[11px] font-mono font-semibold text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 critical-pulse" />
                {criticalCount} CRITICAL
              </div>
            )}
            {highCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.06] px-3 py-1.5 text-[11px] font-mono font-semibold text-orange-400">
                {highCount} HIGH
              </div>
            )}
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-2.5 py-1.5 text-[10px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-live-blink" />
              Live
            </div>
          </div>
        )}
      </motion.div>

      {/* ─── Empty state ─────────────────────────────────────────────────── */}
      {alerts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-20 rounded-xl border border-white/[0.06] bg-surface text-center"
        >
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-full bg-emerald-500/[0.08] blur-2xl scale-150" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07]">
              <Bell className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1 text-[11px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-live-blink" />
            No active alerts
          </div>
          <h2 className="text-base font-semibold text-zinc-100">Alert queue is clear</h2>
          <p className="mt-2 max-w-sm text-sm text-zinc-500 leading-relaxed">
            New HIGH and CRITICAL incidents will appear here automatically when created in your
            organization.
          </p>
        </motion.div>
      )}

      {/* ─── Alert list ──────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-surface">
          <AnimatePresence initial={false}>
            {alerts.map((alert) => {
              const incident = alert.incident;
              const isCritical = alert.severity === 'CRITICAL';

              return (
                <motion.article
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    'flex min-w-0 flex-col gap-4 border-b border-white/[0.05] p-4 transition-colors last:border-b-0 hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between',
                    isCritical && 'border-l-2 border-l-red-500/40'
                  )}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    {/* Severity icon */}
                    <div
                      className={cn(
                        'shrink-0 rounded-lg border p-2',
                        isCritical
                          ? 'border-red-800/40 bg-red-950/40 text-red-400'
                          : 'border-orange-800/40 bg-orange-950/40 text-orange-400'
                      )}
                    >
                      <ShieldAlert className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <SeverityBadge severity={alert.severity} size="xs" />
                        <span className="font-mono text-[10px] text-zinc-600">{incident.id}</span>
                        <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[9px] font-mono text-zinc-500">
                          {incident.category}
                        </span>
                      </div>

                      <h3 className="mt-1.5 break-words text-sm font-semibold text-zinc-100">
                        {incident.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-zinc-500">
                        {incident.description}
                      </p>

                      {/* Metadata row */}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-mono text-zinc-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatElapsed(incident.created_at)} elapsed
                        </span>
                        <span>Updated {formatRelativeTime(alert.timestamp)}</span>
                        {incident.assigned_to && (
                          <span>→ {incident.assigned_to.full_name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-2">
                    <StatusBadge status={incident.status} size="xs" />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleAcknowledge(incident, e)}
                        className="text-zinc-500 hover:text-zinc-300"
                        aria-label={`Acknowledge alert for ${incident.title}`}
                      >
                        Ack
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpen(incident)}
                        aria-label={`Open incident ${incident.id}`}
                      >
                        Investigate
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
