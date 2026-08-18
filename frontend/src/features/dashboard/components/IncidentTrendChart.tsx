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
  if (isLoading) return null;

  return (
    <Card hoverEffect={false} className="h-[320px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-subtle">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold text-zinc-100">
            Incident Volume & Severity Trends
          </CardTitle>
          <CardDescription>24-hour incident activity</CardDescription>
        </div>
        <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-wider text-zinc-500">
          UTC
        </span>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 pt-3">
        <div
          className="h-full w-full"
          role="img"
          aria-label="24-hour incident volume and severity trend chart"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCriticalTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorHighTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMediumTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis dataKey="timestamp" stroke="#52525b" fontSize={10} tickLine={false} />
              <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} width={28} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#f4f4f5',
                }}
              />
              <Legend
                verticalAlign="top"
                height={24}
                wrapperStyle={{ fontSize: '10px', color: '#a1a1aa' }}
              />

              <Area type="monotone" dataKey="critical" name="Critical" stroke="#ef4444" fillOpacity={1} fill="url(#colorCriticalTrend)" strokeWidth={1.8} />
              <Area type="monotone" dataKey="high" name="High" stroke="#f97316" fillOpacity={1} fill="url(#colorHighTrend)" strokeWidth={1.8} />
              <Area type="monotone" dataKey="medium" name="Medium" stroke="#eab308" fillOpacity={1} fill="url(#colorMediumTrend)" strokeWidth={1.8} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentTrendChart;
