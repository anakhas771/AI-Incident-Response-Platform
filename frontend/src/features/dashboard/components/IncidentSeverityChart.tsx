import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../../components/ui/Card';
import { IncidentSeverityDistributionItem } from '../types';

interface IncidentSeverityChartProps {
  data: IncidentSeverityDistributionItem[];
  isLoading?: boolean;
}

export const IncidentSeverityChart: React.FC<IncidentSeverityChartProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading) return null;

  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <Card hoverEffect={false} className="flex min-w-0 flex-col">
      <CardHeader className="border-b border-subtle pb-3">
        <CardTitle className="text-sm font-semibold text-zinc-100">Severity Distribution</CardTitle>
        <CardDescription>Active incident queue</CardDescription>
      </CardHeader>

      <CardContent className="flex min-w-0 flex-col gap-5 pt-4 sm:flex-row sm:items-center">
        <div
          className="mx-auto h-40 w-40 shrink-0 sm:mx-0 sm:h-36 sm:w-36"
          role="img"
          aria-label="Incident severity distribution pie chart"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={43}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#f4f4f5',
                }}
                formatter={(value: unknown, name: unknown) => [
                  `${Number(value)} incidents`,
                  String(name),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="min-w-0 flex-1 space-y-3 text-xs font-mono">
          {data.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="truncate font-medium text-zinc-300">{item.name}</span>
                  </span>
                  <span className="shrink-0 text-zinc-400">
                    <strong className="text-zinc-100">{item.value}</strong> ({pct}%)
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: item.fill }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentSeverityChart;
