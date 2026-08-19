import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Plus, ShieldAlert, Sparkles } from 'lucide-react';
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
  SystemHealthCard,
  useDashboardMetrics,
} from '../features/dashboard';

export const DashboardPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useDashboardMetrics('24h');
  const { setCreateModalOpen } = useCommandStore();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refetch();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [refetch]);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Command center</h1>
            <p className="mt-1 text-sm text-zinc-500">Preparing the latest security telemetry.</p>
          </div>
        </div>
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
      className="w-full min-w-0 space-y-5 sm:space-y-6"
      role="main"
      aria-label="Enterprise Command Center Dashboard"
    >
      <section className="flex min-w-0 flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live operations
          </div>
          <h1 className="mt-3 break-words text-2xl font-semibold tracking-[-0.035em] text-zinc-50 sm:text-3xl lg:text-4xl">
            Command center
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
            Live incident volume, infrastructure health, active response queues, and Copilot intelligence.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
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
            onClick={() => setCreateModalOpen(true)}
            aria-label="Report a new incident"
          >
            <Plus className="h-3.5 w-3.5" />
            Report incident
          </Button>
        </div>
      </section>

      {criticalIncident && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl border border-red-500/15 bg-red-500/[0.045] px-4 py-4 sm:px-5"
          role="alert"
          aria-label={`Critical incident alert: ${criticalIncident.title}`}
        >
          <div className="flex min-w-0 flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 shrink-0 rounded-lg border border-red-500/10 bg-red-500/[0.08] p-2 text-red-300">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-300">
                    Critical incident
                  </span>
                  <span className="break-all font-mono text-[11px] text-zinc-600">{criticalIncident.id}</span>
                </div>
                <h2 className="mt-1 break-words text-sm font-semibold text-zinc-100">
                  {criticalIncident.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                  {criticalIncident.description}
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => navigate(`/incidents/${criticalIncident.id}`)}
            >
              Investigate
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>
      )}

      {data.recentIncidents.length === 0 ? (
        <DashboardEmptyState onReportIncident={() => setCreateModalOpen(true)} />
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-12">
          <section className="min-w-0 xl:col-span-8">
            <IncidentTrendChart data={data.incidentTrends} />
          </section>

          <section className="min-w-0 xl:col-span-4">
            <IncidentSeverityChart data={data.severityDistribution} />
          </section>

          <section className="min-w-0 xl:col-span-12">
            <SystemHealthCard health={data.systemHealth} />
          </section>

          <section className="min-w-0 xl:col-span-8">
            <RecentIncidentFeed incidents={activeIncidents} />
          </section>

          <section className="min-w-0 xl:col-span-4">
            <RecentAiActivityFeed activities={data.recentAiActivity} />
          </section>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
