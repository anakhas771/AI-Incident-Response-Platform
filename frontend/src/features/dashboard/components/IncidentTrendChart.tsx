import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../../components/ui/Card';
import { IncidentTrendPoint } from '../types';

interface IncidentTrendChartProps {
  data: IncidentTrendPoint[];
  isLoading?: boolean;
}

export const IncidentTrendChart: React.FC<IncidentTrendChartProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading) {
    return null; // Handled by DashboardSkeleton
  }

  return (
    <Card hoverEffect={false} className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-subtle">
        <div>
          <CardTitle className="text-sm font-semibold text-zinc-100">
            Incident Volume & Severity Trends
          </CardTitle>
          <CardDescription>24-hour continuous monitoring telemetry</CardDescription>
        </div>
        <span className="text-xs font-mono text-zinc-400">UTC Timeline</span>
      </CardHeader>

      <CardContent className="h-72 pt-4 flex-1">
        <div
          className="w-full h-full"
          role="img"
          aria-label="24-hour incident volume and severity trend chart"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCriticalTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorHighTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMediumTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
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
                  color: '#f4f4f5',
                }}
              />
              <Legend
                verticalAlign="top"
                height={28}
                wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }}
              />

              <Area
                type="monotone"
                dataKey="critical"
                name="Critical"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorCriticalTrend)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="high"
                name="High"
                stroke="#f97316"
                fillOpacity={1}
                fill="url(#colorHighTrend)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="medium"
                name="Medium"
                stroke="#eab308"
                fillOpacity={1}
                fill="url(#colorMediumTrend)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentTrendChart;
