import React from 'react';
import { BarChart3, Clock, CheckCircle2, Cpu } from 'lucide-react';
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
} from 'recharts';
import { mockSystemMetrics } from '../services/mockData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" /> SLA & Response Analytics
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Mean Time To Detect (MTTD), Mean Time To Resolve (MTTR), and SLA compliance tracking
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverEffect={false}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Average MTTR
            </span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-zinc-100 mt-2">
            {mockSystemMetrics.mttr_minutes} min
          </p>
          <p className="text-[11px] text-emerald-400 font-mono mt-1">18% faster than SLA target</p>
        </Card>

        <Card hoverEffect={false}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Average MTTD
            </span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-zinc-100 mt-2">
            {mockSystemMetrics.mttd_minutes} min
          </p>
          <p className="text-[11px] text-emerald-400 font-mono mt-1">Real-time telemetry stream</p>
        </Card>

        <Card hoverEffect={false}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              SLA Compliance Rate
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-zinc-100 mt-2">
            {mockSystemMetrics.sla_compliance_pct}%
          </p>
          <p className="text-[11px] text-zinc-400 font-mono mt-1">0 Breaches in Q3 2026</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card hoverEffect={false}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-zinc-100">
              Weekly MTTR vs MTTD Performance
            </CardTitle>
            <CardDescription>Measured in minutes across 7-day rolling window</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockSystemMetrics.response_times}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="mttr" fill="#6366f1" name="MTTR (Mins)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mttd" fill="#06b6d4" name="MTTD (Mins)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card hoverEffect={false}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-zinc-100">
              24-Hour Severity Distribution Trend
            </CardTitle>
            <CardDescription>Breakdown by Critical and High severity incidents</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockSystemMetrics.incident_trends}>
                <XAxis dataKey="timestamp" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
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
                  fill="#ef4444"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="high"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
