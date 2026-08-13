import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Plus, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useCommandStore } from '../stores/useCommandStore';
import {
  useDashboardMetrics,
  ExecutiveKpiCards,
  IncidentSeverityChart,
  IncidentTrendChart,
  RecentIncidentFeed,
  RecentAiActivityFeed,
  SystemHealthCard,
  DashboardSkeleton,
  DashboardErrorState,
  DashboardEmptyState,
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
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
              Command Center Overview
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">Loading telemetry monitors...</p>
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
    (i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED' && i.status !== 'CLOSED'
  );

  return (
    <div className="space-y-6" role="main" aria-label="Enterprise Command Center Dashboard">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            Command Center Overview
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800"
              role="status"
              aria-label="System telemetry: LIVE"
            >
              LIVE TELEMETRY
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time AI threat monitoring, automated MTTR tracking, and incident queue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/ai-assistant">
            <Button variant="ai" size="sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch AI Copilot</span>
            </Button>
          </Link>
          <Button
            variant="default"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            aria-label="Report a new incident"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Incident</span>
          </Button>
        </div>
      </div>

      {/* Critical Threat Alert Banner */}
      {criticalIncident && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-red-950/70 via-surface to-surface border border-red-800/60 shadow-lg"
          role="alert"
          aria-label={`Critical incident alert: ${criticalIncident.title}`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-900/40 text-red-400 border border-red-700/50 shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5 critical-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">
                    CRITICAL THREAT REQUIRING IMMEDIATE RESPONSE
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">• {criticalIncident.id}</span>
                </div>
                <h2 className="text-sm font-semibold text-zinc-100 mt-0.5">
                  {criticalIncident.title}
                </h2>
                <p className="text-xs text-zinc-400 line-clamp-1 mt-1">
                  {criticalIncident.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => navigate(`/incidents/${criticalIncident.id}`)}
                aria-label={`Investigate critical incident ${criticalIncident.id}`}
              >
                <span>Investigate Incident</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Executive KPI Metrics Grid */}
      <ExecutiveKpiCards kpis={data.kpis} />

      {/* Main Dashboard Interactive Grid */}
      {data.recentIncidents.length === 0 ? (
        <DashboardEmptyState onReportIncident={() => setCreateModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 spans): Charts & Feed */}
          <div className="lg:col-span-2 space-y-6">
            <IncidentTrendChart data={data.incidentTrends} />
            <RecentIncidentFeed incidents={data.recentIncidents} />
          </div>

          {/* Right Column (1 span): Severity Distribution, System Health, AI Intelligence */}
          <div className="space-y-6">
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
