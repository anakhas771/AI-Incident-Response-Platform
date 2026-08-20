import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../../components/ui/Card';
import { IncidentTrendPoint, DashboardTimeframe } from '../types';
import { cn } from '../../../utils/cn';

interface IncidentTrendChartProps {
  data: IncidentTrendPoint[];
  isLoading?: boolean;
  onTimeframeChange?: (tf: DashboardTimeframe) => void;
  activeTimeframe?: DashboardTimeframe;
}

const TIMEFRAMES: { label: string; value: DashboardTimeframe }[] = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0d0e12]/95 backdrop-blur-xl p-3 shadow-2xl text-xs">
      <p className="font-mono text-zinc-500 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-zinc-400">{entry.name}:</span>
          <span className="font-semibold text-zinc-200 font-mono">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export const IncidentTrendChart: React.FC<IncidentTrendChartProps> = ({
  data,
  isLoading = false,
  onTimeframeChange,
  activeTimeframe = '24h',
}) => {
  const [localTimeframe, setLocalTimeframe] = useState<DashboardTimeframe>(activeTimeframe);

  if (isLoading) return null;

  const handleTimeframeClick = (tf: DashboardTimeframe) => {
    setLocalTimeframe(tf);
    onTimeframeChange?.(tf);
  };

  return (
    <Card hoverEffect={false} className="flex min-w-0 flex-col bg-surface border-white/[0.06]">
      <CardHeader className="flex flex-row items-start justify-between border-b border-white/[0.05] pb-3 gap-4">
        <div className="min-w-0">
          <CardTitle className="break-words text-sm font-semibold text-zinc-100">
            Incident Volume &amp; Severity Trends
          </CardTitle>
          <CardDescription className="mt-0.5">
            {localTimeframe === '24h' ? '24-hour' : localTimeframe === '7d' ? '7-day' : '30-day'}{' '}
            incident activity by severity
          </CardDescription>
        </div>

        {/* Time range selector */}
        <div
          className="flex shrink-0 items-center gap-0.5 rounded-lg border border-white/[0.07] bg-white/[0.025] p-0.5"
          role="group"
          aria-label="Time range selector"
        >
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => handleTimeframeClick(tf.value)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider transition-all',
                localTimeframe === tf.value
                  ? 'bg-indigo-500/[0.18] text-indigo-300 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04]'
              )}
              aria-pressed={localTimeframe === tf.value}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 pt-4 p-0 px-1 pb-2">
        <div
          className="aspect-[16/7] min-h-[200px] w-full sm:min-h-[220px]"
          role="img"
          aria-label="Incident volume and severity trend chart"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCritical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradMedium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.14} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                content={<CustomTooltip />}
                cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
              />

              <Area
                type="monotone"
                dataKey="critical"
                name="Critical"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#gradCritical)"
                strokeWidth={1.8}
                dot={false}
                activeDot={{ r: 3, fill: '#ef4444', stroke: '#07080c', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="high"
                name="High"
                stroke="#f97316"
                fillOpacity={1}
                fill="url(#gradHigh)"
                strokeWidth={1.8}
                dot={false}
                activeDot={{ r: 3, fill: '#f97316', stroke: '#07080c', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="medium"
                name="Medium"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#gradMedium)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: '#f59e0b', stroke: '#07080c', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="low"
                name="Low"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#gradLow)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: '#10b981', stroke: '#07080c', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 pt-1">
          {[
            { label: 'Critical', color: '#ef4444' },
            { label: 'High', color: '#f97316' },
            { label: 'Medium', color: '#f59e0b' },
            { label: 'Low', color: '#10b981' },
          ].map((entry) => (
            <div key={entry.label} className="flex items-center gap-1.5">
              <span className="w-2 h-0.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[10px] font-mono text-zinc-500">{entry.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentTrendChart;
