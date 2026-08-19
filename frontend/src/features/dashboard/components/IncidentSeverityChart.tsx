import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../../components/ui/Card';
import { IncidentSeverityDistributionItem } from '../types';
import { cn } from '../../../utils/cn';

interface IncidentSeverityChartProps {
  data: IncidentSeverityDistributionItem[];
  isLoading?: boolean;
  onSeverityFilter?: (severity: string | null) => void;
}

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: IncidentSeverityDistributionItem }>;
}) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0d0e12]/95 backdrop-blur-xl p-3 shadow-2xl text-xs">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: item.payload.fill }}
        />
        <span className="font-semibold text-zinc-200">{item.name}</span>
      </div>
      <p className="font-mono text-zinc-400">
        <span className="text-zinc-100 font-semibold">{item.value}</span> incidents
      </p>
    </div>
  );
};

export const IncidentSeverityChart: React.FC<IncidentSeverityChartProps> = ({
  data,
  isLoading = false,
  onSeverityFilter,
}) => {
  const [activeSeverity, setActiveSeverity] = useState<string | null>(null);

  if (isLoading) return null;

  const total = data.reduce((acc, item) => acc + item.value, 0);
  const displayData = data.filter((d) => d.value > 0);

  const handleSeverityClick = (severity: string) => {
    const next = activeSeverity === severity ? null : severity;
    setActiveSeverity(next);
    onSeverityFilter?.(next);
  };

  return (
    <Card hoverEffect={false} className="flex min-w-0 flex-col bg-surface border-white/[0.06]">
      <CardHeader className="border-b border-white/[0.05] pb-3">
        <CardTitle className="text-sm font-semibold text-zinc-100">Severity Distribution</CardTitle>
        <CardDescription className="mt-0.5">
          {total > 0
            ? `${total} incident${total === 1 ? '' : 's'} in queue`
            : 'No active incidents'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex min-w-0 flex-col gap-5 pt-5 sm:flex-row sm:items-center">
        {/* Donut chart */}
        <div
          className="relative mx-auto flex shrink-0 items-center justify-center sm:mx-0"
          role="img"
          aria-label="Incident severity distribution chart"
        >
          <div className="h-36 w-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={
                    displayData.length > 0
                      ? displayData
                      : [{ name: 'None', value: 1, fill: '#27272a' }]
                  }
                  innerRadius={46}
                  outerRadius={66}
                  paddingAngle={displayData.length > 1 ? 3 : 0}
                  dataKey="value"
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {(displayData.length > 0
                    ? displayData
                    : [{ name: 'None', value: 1, fill: '#27272a' }]
                  ).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      opacity={activeSeverity === null || activeSeverity === entry.name ? 1 : 0.3}
                      style={{
                        cursor: displayData.length > 0 ? 'pointer' : 'default',
                        transition: 'opacity 200ms ease',
                      }}
                      onClick={() => {
                        if (displayData.length > 0) handleSeverityClick(entry.name);
                      }}
                    />
                  ))}
                </Pie>
                {displayData.length > 0 && <Tooltip content={<CustomTooltip />} />}
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Center label */}
          <div className="absolute pointer-events-none flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-zinc-50 leading-none">{total}</span>
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider mt-0.5">
              total
            </span>
          </div>
        </div>

        {/* Legend / filter */}
        <div className="min-w-0 flex-1 space-y-2">
          {data.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const isActive = activeSeverity === item.name;
            const isFiltered = activeSeverity !== null && !isActive;

            return (
              <button
                key={item.name}
                onClick={() => handleSeverityClick(item.name)}
                className={cn(
                  'w-full text-left space-y-1 rounded-lg px-2 py-1.5 transition-all duration-150 outline-none',
                  'hover:bg-white/[0.04] focus-visible:ring-1 focus-visible:ring-indigo-500',
                  isActive && 'bg-white/[0.05]',
                  isFiltered && 'opacity-50'
                )}
                aria-pressed={isActive}
                aria-label={`Filter by ${item.name} severity`}
              >
                <div className="flex items-center justify-between gap-3 text-xs font-mono">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        'h-2 w-2 shrink-0 rounded-full transition-all',
                        isActive && 'ring-2 ring-offset-1 ring-offset-transparent'
                      )}
                      style={{
                        backgroundColor: item.fill,
                        boxShadow: isActive ? `0 0 6px ${item.fill}` : undefined,
                      }}
                    />
                    <span className="font-medium text-zinc-300">
                      {SEVERITY_LABELS[item.name] || item.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-zinc-500">
                    <strong className="text-zinc-200">{item.value}</strong>
                    <span className="text-zinc-600 ml-1">({pct}%)</span>
                  </span>
                </div>
                <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.fill,
                      opacity: isFiltered ? 0.4 : 1,
                    }}
                  />
                </div>
              </button>
            );
          })}

          {activeSeverity && (
            <button
              onClick={() => {
                setActiveSeverity(null);
                onSeverityFilter?.(null);
              }}
              className="w-full text-center text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors pt-1"
            >
              Clear filter
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentSeverityChart;
