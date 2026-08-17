import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Plus, ShieldAlert, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { useCommandStore } from '../stores/useCommandStore';
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardSkeleton,
  ExecutiveKpiCards,
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

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
              Operations overview
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Preparing the latest security telemetry.</p>
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

  const criticalIncident = data.recentIncidents.find(
    (incident) =>
      incident.severity === 'CRITICAL' &&
      incident.status !== 'RESOLVED' &&
      incident.status !== 'CLOSED'
  );

  return (
    <div className="space-y-8" role="main" aria-label="Enterprise Command Center Dashboard">
      <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live operations
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-[-0.035em] text-zinc-50">
            Command center
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-500 max-w-2xl leading-6">
            A focused view of incident volume, response performance, system health, and recent
            AI-assisted activity.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/ai-assistant">
            <Button variant="ai" size="sm">
              <Sparkles className="w-3.5 h-3.5" />
              Copilot
            </Button>
          </Link>
          <Button
            variant="default"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            aria-label="Report a new incident"
          >
            <Plus className="w-3.5 h-3.5" />
            Report incident
          </Button>
        </div>
      </section>

      {criticalIncident && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl border border-red-500/15 bg-red-500/[0.045] px-5 py-4"
          role="alert"
          aria-label={`Critical incident alert: ${criticalIncident.title}`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 p-2 rounded-lg bg-red-500/[0.08] border border-red-500/10 text-red-300 shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-semibold text-red-300 uppercase tracking-[0.14em]">
                    Critical incident
                  </span>
                  <span className="text-[11px] text-zinc-600 font-mono">{criticalIncident.id}</span>
                </div>
                <h2 className="mt-1 text-sm font-semibold text-zinc-100 truncate">
                  {criticalIncident.title}
                </h2>
                <p className="mt-1 text-xs text-zinc-500 line-clamp-1">
                  {criticalIncident.description}
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => navigate(`/incidents/${criticalIncident.id}`)}
              aria-label={`Investigate critical incident ${criticalIncident.id}`}
            >
              Investigate
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </motion.div>
      )}

      <ExecutiveKpiCards kpis={data.kpis} />

      {data.recentIncidents.length === 0 ? (
        <DashboardEmptyState onReportIncident={() => setCreateModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <IncidentTrendChart data={data.incidentTrends} />
            <RecentIncidentFeed incidents={data.recentIncidents} />
          </div>

          <div className="space-y-5">
            <IncidentSeverityChart data={data.severityDistribution} />
            <SystemHealthCard health={data.systemHealth} />
            <RecentAiActivityFeed activities={data.recentAiActivity} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
