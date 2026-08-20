import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Plus, ShieldAlert, Sparkles, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { useCommandStore } from '../stores/useCommandStore';
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardSkeleton,
  IncidentSeverityChart,
  IncidentTrendChart,
  RecentAiActivityFeed,
  RecentIncidentFeed,
  useDashboardMetrics,
} from '../features/dashboard';
import { DashboardTimeframe } from '../features/dashboard/types';

function useElapsedTime(createdAt: string): string {
  const now = Date.now();
  const diff = now - new Date(createdAt).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m elapsed`;
  const hr = Math.floor(min / 60);
  return `${hr}h ${min % 60}m elapsed`;
}

export const DashboardPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<DashboardTimeframe>('24h');
  const { data, isLoading, isError, error, refetch } = useDashboardMetrics(timeframe);
  const { setCreateModalOpen } = useCommandStore();
  const navigate = useNavigate();

  if (isLoading || !data) {
    return (
      <div className="space-y-5">
        <PageHeader onCreateIncident={() => setCreateModalOpen(true)} />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <DashboardErrorState
        error={error?.message || 'Failed to load dashboard metrics'}
        onRetry={() => void refetch()}
      />
    );
  }

  const activeIncidents = data.recentIncidents.filter(
    (incident) => incident.status !== 'RESOLVED' && incident.status !== 'CLOSED'
  );

  const criticalIncident = activeIncidents.find((incident) => incident.severity === 'CRITICAL');

  return (
    <div
      className="w-full min-w-0 space-y-5"
      role="main"
      aria-label="Enterprise Security Command Center"
    >
      <PageHeader onCreateIncident={() => setCreateModalOpen(true)} />

      {/* ─── Critical Alert Banner ──────────────────────────────────────── */}
      {criticalIncident && (
        <CriticalAlertBanner
          incident={criticalIncident}
          onInvestigate={() => navigate(`/incidents/${criticalIncident.id}`)}
        />
      )}

      {/* ─── Main Dashboard Content ─────────────────────────────────────── */}
      {data.recentIncidents.length === 0 ? (
        <DashboardEmptyState onReportIncident={() => setCreateModalOpen(true)} />
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-12">
          {/* Trend Chart */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4, ease: 'easeOut' }}
            className="min-w-0 xl:col-span-8"
          >
            <IncidentTrendChart
              data={data.incidentTrends}
              activeTimeframe={timeframe}
              onTimeframeChange={(tf) => setTimeframe(tf)}
            />
          </motion.section>

          {/* Severity Distribution */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
            className="min-w-0 xl:col-span-4"
          >
            <IncidentSeverityChart data={data.severityDistribution} />
          </motion.section>

          {/* Active Incident Queue */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
            className="min-w-0 xl:col-span-8"
          >
            <RecentIncidentFeed incidents={activeIncidents} />
          </motion.section>

          {/* AI Copilot Intelligence */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
            className="min-w-0 xl:col-span-4"
          >
            <RecentAiActivityFeed activities={data.recentAiActivity} />
          </motion.section>
        </div>
      )}
    </div>
  );
};

/* ─── Page Header ────────────────────────────────────────────────────── */
const PageHeader: React.FC<{ onCreateIncident: () => void }> = ({ onCreateIncident }) => (
  <motion.section
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
    className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-end"
  >
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-live-blink" />
        Live operations
      </div>
      <h1 className="mt-2 break-words text-2xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-3xl">
        Command Center
      </h1>
      <p className="mt-1.5 max-w-xl text-sm leading-6 text-zinc-500">
        Live incident volume, response trends, active investigations, and Copilot intelligence.
      </p>
    </div>

    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
      <Link to="/ai-assistant" className="flex-1 sm:flex-none">
        <Button variant="ai" size="sm" className="w-full sm:w-auto">
          <Sparkles className="h-3.5 w-3.5" />
          Copilot
        </Button>
      </Link>
      <Button
        variant="default"
        size="sm"
        className="flex-1 sm:w-auto sm:flex-none"
        onClick={onCreateIncident}
        aria-label="Report a new incident"
      >
        <Plus className="h-3.5 w-3.5" />
        Report incident
      </Button>
    </div>
  </motion.section>
);

/* ─── Critical Alert Banner ──────────────────────────────────────────── */
const CriticalAlertBanner: React.FC<{
  incident: { id: string; title: string; description: string; created_at: string };
  onInvestigate: () => void;
}> = ({ incident, onInvestigate }) => {
  const elapsed = useElapsedTime(incident.created_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-xl border border-red-500/20 bg-red-500/[0.05] critical-glow"
      role="alert"
      aria-label={`Critical incident alert: ${incident.title}`}
    >
      {/* Subtle red glow edge */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500/60 rounded-r-full" />

      <div className="px-5 py-4 pl-6">
        <div className="flex min-w-0 flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-lg border border-red-500/15 bg-red-500/[0.09] p-2">
              <ShieldAlert className="h-4 w-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-red-400">
                  Critical incident
                </span>
                <span className="font-mono text-[10px] text-zinc-700">{incident.id}</span>
                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-zinc-600">
                  <Clock className="h-2.5 w-2.5" />
                  {elapsed}
                </span>
              </div>
              <h2 className="mt-1 break-words text-sm font-semibold text-zinc-100">
                {incident.title}
              </h2>
              <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-zinc-500">
                {incident.description}
              </p>
            </div>
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="w-full shrink-0 lg:w-auto"
            onClick={onInvestigate}
          >
            Investigate
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;
