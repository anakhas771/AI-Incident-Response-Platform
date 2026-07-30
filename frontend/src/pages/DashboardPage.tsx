import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Plus,
  ChevronRight,
  Server,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useIncidentStore } from '../store/useIncidentStore';
import { useCommandStore } from '../store/useCommandStore';
import { mockSystemMetrics, mockActivityLogs } from '../services/mockData';
import { SeverityBadge, StatusBadge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { incidents, setSelectedIncident } = useIncidentStore();
  const { setCreateModalOpen } = useCommandStore();
  const navigate = useNavigate();

  const activeIncidents = incidents.filter((i) => i.status !== 'CLOSED' && i.status !== 'RESOLVED');
  const criticalIncident =
    activeIncidents.find((i) => i.severity === 'CRITICAL') || activeIncidents[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            Command Center Overview
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
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
          <Button variant="default" size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span>Report Incident</span>
          </Button>
        </div>
      </div>

      {criticalIncident && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-red-950/70 via-surface to-surface border border-red-800/60 shadow-lg"
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
                onClick={() => {
                  setSelectedIncident(criticalIncident);
                  navigate(`/incidents/${criticalIncident.id}`);
                }}
              >
                <span>Investigate Incident</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Active Incidents
            </span>
            <div className="p-2 rounded-lg bg-red-950/50 text-red-400 border border-red-800/40">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-zinc-100">
              {activeIncidents.length}
            </span>
            <span className="text-xs font-mono text-red-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +1 new
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">1 Critical • 1 High • 1 Medium</p>
        </Card>

        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              MTTR (Mean Time)
            </span>
            <div className="p-2 rounded-lg bg-indigo-950/50 text-indigo-400 border border-indigo-800/40">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-zinc-100">
              {mockSystemMetrics.mttr_minutes}m
            </span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              -14% vs last week
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            MTTD: {mockSystemMetrics.mttd_minutes}m (Detection Time)
          </p>
        </Card>

        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              SLA Compliance
            </span>
            <div className="p-2 rounded-lg bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-zinc-100">
              {mockSystemMetrics.sla_compliance_pct}%
            </span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              Target: 99.0%
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">0 SLA breaches in past 30 days</p>
        </Card>

        <Card aiGlow hoverEffect className="relative overflow-hidden border-indigo-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Insights
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
              ACTIVE
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-zinc-100">92%</span>
            <span className="text-xs font-mono text-indigo-300">RCA Confidence</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">3 Auto-remediations suggested</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card hoverEffect={false}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-100">
                  Incident Volume & Severity Trends
                </CardTitle>
                <CardDescription>24-hour continuous monitoring telemetry</CardDescription>
              </div>
              <span className="text-xs font-mono text-zinc-400">UTC Timeline</span>
            </CardHeader>
            <CardContent className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockSystemMetrics.incident_trends}>
                  <defs>
                    <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" stroke="#52525b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="critical"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorCritical)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="high"
                    stroke="#f97316"
                    fillOpacity={1}
                    fill="url(#colorHigh)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card hoverEffect={false}>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-subtle">
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-100">
                  Live Active Incidents Queue
                </CardTitle>
                <CardDescription>Prioritized by severity & response SLA</CardDescription>
              </div>
              <Link
                to="/incidents"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <div className="divide-y divide-subtle">
              {incidents.slice(0, 4).map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncident(inc);
                    navigate(`/incidents/${inc.id}`);
                  }}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-surface-elevated/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3 truncate">
                    <SeverityBadge severity={inc.severity} />
                    <div className="truncate">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                        {inc.title}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 font-mono">
                        <span>{inc.id}</span>
                        <span>•</span>
                        <span>{inc.category}</span>
                        <span>•</span>
                        <span>
                          Assignee: {inc.assigned_to ? inc.assigned_to.full_name : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={inc.status} />
                    <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card hoverEffect={false}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-100">
                Severity Distribution
              </CardTitle>
              <CardDescription>Breakdown across active platform queue</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="w-36 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockSystemMetrics.severity_distribution}
                      innerRadius={40}
                      outerRadius={60}
                      dataKey="value"
                    >
                      {mockSystemMetrics.severity_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {mockSystemMetrics.severity_distribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-zinc-300">{item.name}</span>
                    </span>
                    <span className="font-bold text-zinc-100">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card hoverEffect={false} className="bg-surface-elevated">
            <CardHeader className="pb-3 border-b border-subtle">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-400" /> Infrastructure Health
                </CardTitle>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  HEALTHY
                </span>
              </div>
            </CardHeader>
            <div className="p-4 space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Kubernetes EKS Cluster</span>
                <span className="text-emerald-400">99.98% uptime</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">PostgreSQL RDS Primary</span>
                <span className="text-emerald-400">12ms latency</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Redis Cache Invalidation</span>
                <span className="text-emerald-400">Operational</span>
              </div>
            </div>
          </Card>

          <Card hoverEffect={false}>
            <CardHeader className="pb-3 border-b border-subtle">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" /> Recent Activity Log
                </CardTitle>
                <Link to="/activity-log" className="text-xs text-indigo-400 hover:text-indigo-300">
                  All Logs
                </Link>
              </div>
            </CardHeader>
            <div className="p-4 space-y-3">
              {mockActivityLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 font-semibold">{log.user.full_name}</span>
                    <span className="text-zinc-400">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-zinc-400 truncate">{log.action}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
