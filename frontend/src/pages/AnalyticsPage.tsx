import React, { useState } from 'react';
import {
  BarChart3,
  Clock3,
  CheckCircle2,
  Cpu,
  TrendingDown,
  Activity,
  ArrowUpRight,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { useDashboardMetrics } from '../features/dashboard';
import { DashboardTimeframe } from '../features/dashboard/types';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';

const tooltipStyle = {
  backgroundColor: '#0d0e12',
  borderColor: 'rgba(255,255,255,0.07)',
  borderRadius: '12px',
  fontSize: '11px',
  boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
  color: '#e4e4e7',
};

const TIMEFRAMES: { label: string; value: DashboardTimeframe }[] = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
];

/* ─── Helpers ──────────────────────────────────────────────────────────── */
function formatMttr(minutes: number): string {
  if (minutes <= 0) return '—';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* ─── Unavailable Metric ───────────────────────────────────────────────── */
const DataUnavailable: React.FC<{ label?: string }> = ({ label = 'Data unavailable' }) => (
  <div className="flex items-center gap-1.5 text-zinc-600">
    <HelpCircle className="h-3.5 w-3.5 shrink-0" />
    <span className="text-sm font-mono">{label}</span>
  </div>
);

/* ─── KPI Card ─────────────────────────────────────────────────────────── */
interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  iconBg: string;
  trend?: React.ReactNode;
  note?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, iconBg, trend, note }) => (
  <Card hoverEffect={false} className="relative overflow-hidden border-white/[0.06] bg-surface">
    <div className="flex items-start justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-zinc-500">
        {label}
      </span>
      <span className={cn('rounded-lg border p-2', iconBg)}>{icon}</span>
    </div>
    <div className="mt-4">
      <div className="text-2xl font-semibold tracking-tight text-zinc-50">{value}</div>
      {trend && <div className="mt-1.5">{trend}</div>}
      {note && <p className="mt-1 text-[10px] text-zinc-700 font-mono">{note}</p>}
    </div>
  </Card>
);

export const AnalyticsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<DashboardTimeframe>('24h');
  const { data, isLoading, isError, refetch } = useDashboardMetrics(timeframe);

  return (
    <div className="relative min-h-full">
      {/* Subtle background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-indigo-500/[0.07] blur-3xl" />
        <div className="absolute right-[-8rem] top-32 h-80 w-80 rounded-full bg-cyan-400/[0.05] blur-3xl" />
      </div>

      <div className="relative space-y-6">
        {/* ─── Header ──────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"
        >
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-400/70">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              Performance intelligence
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
              Operational Analytics
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Incident trends, response performance, and AI activity derived from live organization
              data.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time range selector */}
            <div
              className="flex items-center gap-0.5 rounded-lg border border-white/[0.07] bg-white/[0.025] p-0.5"
              role="group"
              aria-label="Time range"
            >
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider transition-all',
                    timeframe === tf.value
                      ? 'bg-indigo-500/[0.18] text-indigo-300'
                      : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04]'
                  )}
                  aria-pressed={timeframe === tf.value}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500 backdrop-blur-xl">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              Live telemetry
            </div>
          </div>
        </motion.header>

        {/* ─── Error state ─────────────────────────────────────────────── */}
        {isError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-sm text-red-400 flex items-center justify-between gap-4">
            <span>Failed to load analytics data.</span>
            <button
              onClick={() => void refetch()}
              className="text-xs text-red-300 hover:text-red-200 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ─── KPI Cards ───────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Key performance indicators"
        >
          {/* Incident Volume */}
          <KpiCard
            label="Incident Volume"
            value={
              isLoading ? (
                <div className="skeleton h-8 w-12 rounded" />
              ) : (
                <span>
                  {data?.kpis.incidentCount ?? 0}
                  <span className="ml-1.5 text-sm text-zinc-500">total</span>
                </span>
              )
            }
            icon={<AlertTriangle className="h-4 w-4 text-amber-300" />}
            iconBg="border-amber-400/15 bg-amber-400/[0.07]"
            note="All time"
          />

          {/* Open Incidents */}
          <KpiCard
            label="Open Incidents"
            value={
              isLoading ? (
                <div className="skeleton h-8 w-12 rounded" />
              ) : (
                <span>
                  {data?.kpis.openIncidents ?? 0}
                  <span className="ml-1.5 text-sm text-zinc-500">active</span>
                </span>
              )
            }
            icon={<BarChart3 className="h-4 w-4 text-red-300" />}
            iconBg="border-red-400/15 bg-red-400/[0.07]"
            trend={
              !isLoading && data && data.kpis.resolvedIncidents > 0 ? (
                <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                  <TrendingDown className="h-3 w-3" />
                  {data.kpis.resolvedIncidents} resolved
                </p>
              ) : undefined
            }
          />

          {/* MTTR */}
          <KpiCard
            label="Avg. MTTR"
            value={
              isLoading ? (
                <div className="skeleton h-8 w-20 rounded" />
              ) : data && data.kpis.mttrMinutes > 0 ? (
                <span>{formatMttr(data.kpis.mttrMinutes)}</span>
              ) : (
                <DataUnavailable label="No data" />
              )
            }
            icon={<Clock3 className="h-4 w-4 text-indigo-300" />}
            iconBg="border-indigo-400/15 bg-indigo-400/[0.07]"
            note={
              !isLoading && data && data.kpis.mttrMinutes > 0
                ? 'From resolved incidents'
                : 'Requires resolved incidents'
            }
          />

          {/* MTTD — Not computed by backend */}
          <KpiCard
            label="Avg. MTTD"
            value={<DataUnavailable label="Data unavailable" />}
            icon={<Cpu className="h-4 w-4 text-cyan-300" />}
            iconBg="border-cyan-400/15 bg-cyan-400/[0.07]"
            note="Not tracked by backend"
          />
        </motion.section>

        {/* ─── Secondary KPIs ──────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {/* SLA Compliance */}
          <KpiCard
            label="SLA Compliance"
            value={<DataUnavailable label="Data unavailable" />}
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-300" />}
            iconBg="border-emerald-400/15 bg-emerald-400/[0.07]"
            note="Not tracked by backend"
          />

          {/* AI Resolution Assist */}
          <KpiCard
            label="AI-Assisted Incidents"
            value={
              isLoading ? (
                <div className="skeleton h-8 w-12 rounded" />
              ) : (
                <span>
                  {data?.recentIncidents.filter((inc) => inc.ai_summary).length ?? 0}
                  <span className="ml-1.5 text-sm text-zinc-500">with AI analysis</span>
                </span>
              )
            }
            icon={<ArrowUpRight className="h-4 w-4 text-purple-300" />}
            iconBg="border-purple-400/15 bg-purple-400/[0.07]"
            note="Incidents with AI RCA completed"
          />
        </motion.section>

        {/* ─── Charts ──────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="grid grid-cols-1 gap-5 lg:grid-cols-2"
        >
          {/* Incident Pressure Chart */}
          <Card hoverEffect={false} className="overflow-hidden border-white/[0.06] bg-surface">
            <CardHeader className="border-b border-white/[0.05] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold text-zinc-100">
                    Incident pressure
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Severity movement over the selected period
                  </CardDescription>
                </div>
                <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-2 text-zinc-500">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="skeleton h-56 w-full rounded-lg" />
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.incidentTrends || []}>
                      <defs>
                        <linearGradient id="aCritical" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="aHigh" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="aMedium" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.04)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="timestamp"
                        stroke="#3f3f46"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#52525b' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke="#3f3f46"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#52525b' }}
                        width={24}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        cursor={{ stroke: 'rgba(255,255,255,0.06)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="critical"
                        name="Critical"
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#aCritical)"
                        strokeWidth={1.8}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="high"
                        name="High"
                        stroke="#f97316"
                        fillOpacity={1}
                        fill="url(#aHigh)"
                        strokeWidth={1.8}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="medium"
                        name="Medium"
                        stroke="#f59e0b"
                        fillOpacity={1}
                        fill="url(#aMedium)"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card hoverEffect={false} className="overflow-hidden border-white/[0.06] bg-surface">
            <CardHeader className="border-b border-white/[0.05] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold text-zinc-100">
                    Category distribution
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Incident breakdown by operational area
                  </CardDescription>
                </div>
                <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-2 text-zinc-500">
                  <BarChart3 className="h-4 w-4" />
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="skeleton h-56 w-full rounded-lg" />
              ) : (
                <CategoryDistributionChart incidents={data?.recentIncidents || []} />
              )}
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  );
};

/* ─── Category Distribution Chart ──────────────────────────────────────── */
const CATEGORY_COLORS: Record<string, string> = {
  Security: '#6366f1',
  Infrastructure: '#22d3ee',
  Application: '#f59e0b',
  Database: '#a855f7',
  Network: '#f97316',
  Other: '#71717a',
};

const CategoryDistributionChart: React.FC<{ incidents: Array<{ category: string }> }> = ({
  incidents,
}) => {
  if (incidents.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-zinc-600 font-mono">
        No incident data available
      </div>
    );
  }

  const countMap: Record<string, number> = {};
  incidents.forEach((inc) => {
    countMap[inc.category] = (countMap[inc.category] || 0) + 1;
  });

  const chartData = Object.entries(countMap)
    .map(([name, value]) => ({ name, value, fill: CATEGORY_COLORS[name] || '#71717a' }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barGap={8} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis
            type="number"
            stroke="#3f3f46"
            fontSize={9}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#52525b' }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#3f3f46"
            fontSize={9}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#a1a1aa' }}
            width={90}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.025)' }} />
          <Bar dataKey="value" name="Incidents" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsPage;
