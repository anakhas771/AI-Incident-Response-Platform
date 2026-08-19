import React from 'react';
import { BarChart3, Clock3, CheckCircle2, Cpu, TrendingDown, Activity, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { mockSystemMetrics } from '../services/mockData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

const chartTooltip = {
  backgroundColor: '#0f0f12',
  borderColor: 'rgba(255,255,255,0.08)',
  borderRadius: '12px',
  fontSize: '12px',
  boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
};

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-indigo-500/[0.09] blur-3xl" />
        <div className="absolute right-[-10rem] top-24 h-96 w-96 rounded-full bg-cyan-400/[0.06] blur-3xl" />
      </div>

      <div className="relative space-y-7">
        <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-300/70">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.9)]" />
              Performance intelligence
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Response performance, detection speed, and incident pressure at a glance.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500 backdrop-blur-xl">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            Live telemetry
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card hoverEffect={false} className="group relative overflow-hidden border-white/[0.06] bg-white/[0.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.08] via-transparent to-transparent opacity-80" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-zinc-500">Average MTTR</span>
                <span className="rounded-lg border border-indigo-400/15 bg-indigo-400/[0.07] p-2 text-indigo-300"><Clock3 className="h-4 w-4" /></span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-zinc-50">{mockSystemMetrics.mttr_minutes}<span className="ml-1 text-sm text-zinc-500">min</span></p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-emerald-400"><TrendingDown className="h-3 w-3" /> 18% faster than target</p>
                </div>
                <div className="text-right text-[10px] text-zinc-600">LAST 7 DAYS</div>
              </div>
            </div>
          </Card>

          <Card hoverEffect={false} className="group relative overflow-hidden border-white/[0.06] bg-white/[0.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/[0.07] via-transparent to-transparent opacity-80" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-zinc-500">Average MTTD</span>
                <span className="rounded-lg border border-cyan-400/15 bg-cyan-400/[0.07] p-2 text-cyan-300"><Cpu className="h-4 w-4" /></span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-zinc-50">{mockSystemMetrics.mttd_minutes}<span className="ml-1 text-sm text-zinc-500">min</span></p>
                  <p className="mt-2 text-[11px] font-medium text-cyan-300">Real-time telemetry signal</p>
                </div>
                <div className="text-right text-[10px] text-zinc-600">DETECTION</div>
              </div>
            </div>
          </Card>

          <Card hoverEffect={false} className="group relative overflow-hidden border-white/[0.06] bg-white/[0.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/[0.07] via-transparent to-transparent opacity-80" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-zinc-500">SLA compliance</span>
                <span className="rounded-lg border border-emerald-400/15 bg-emerald-400/[0.07] p-2 text-emerald-300"><CheckCircle2 className="h-4 w-4" /></span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-zinc-50">{mockSystemMetrics.sla_compliance_pct}<span className="ml-1 text-sm text-zinc-500">%</span></p>
                  <p className="mt-2 text-[11px] font-medium text-emerald-400">Within operational target</p>
                </div>
                <div className="text-right text-[10px] text-zinc-600">CURRENT</div>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card hoverEffect={false} className="overflow-hidden border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="border-b border-white/[0.05] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold text-zinc-100">Response performance</CardTitle>
                  <CardDescription className="mt-1">MTTR vs MTTD across the rolling week</CardDescription>
                </div>
                <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-2 text-zinc-500"><BarChart3 className="h-4 w-4" /></span>
              </div>
            </CardHeader>
            <CardContent className="h-80 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockSystemMetrics.response_times} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#202127" vertical={false} />
                  <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltip} cursor={{ fill: 'rgba(255,255,255,0.025)' }} />
                  <Bar dataKey="mttr" fill="#6366f1" name="MTTR (min)" radius={[7, 7, 2, 2]} />
                  <Bar dataKey="mttd" fill="#22d3ee" name="MTTD (min)" radius={[7, 7, 2, 2]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card hoverEffect={false} className="overflow-hidden border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="border-b border-white/[0.05] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold text-zinc-100">Incident pressure</CardTitle>
                  <CardDescription className="mt-1">Severity movement over the last 24 hours</CardDescription>
                </div>
                <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-2 text-zinc-500"><ArrowUpRight className="h-4 w-4" /></span>
              </div>
            </CardHeader>
            <CardContent className="h-80 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockSystemMetrics.incident_trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#202127" vertical={false} />
                  <XAxis dataKey="timestamp" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltip} />
                  <Area type="monotone" dataKey="critical" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.10} strokeWidth={2} />
                  <Area type="monotone" dataKey="high" stroke="#fb923c" fill="#fb923c" fillOpacity={0.08} strokeWidth={2} />
                  <Area type="monotone" dataKey="medium" stroke="#facc15" fill="#facc15" fillOpacity={0.045} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default AnalyticsPage;
