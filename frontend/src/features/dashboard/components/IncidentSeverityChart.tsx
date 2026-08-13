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
  if (isLoading) {
    return null; // Handled by DashboardSkeleton
  }

  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <Card hoverEffect={false} className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-zinc-100">Severity Distribution</CardTitle>
        <CardDescription>Breakdown across active platform queue</CardDescription>
      </CardHeader>

      <CardContent className="flex items-center justify-between gap-4 flex-1">
        <div className="w-40 h-40" role="img" aria-label="Incident severity distribution pie chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={45}
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
                  fontSize: '12px',
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

        <div className="space-y-2.5 text-xs font-mono flex-1">
          {data.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-zinc-300 font-medium">{item.name}</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-100">{item.value}</span>
                  <span className="text-zinc-500 text-[10px]">({pct}%)</span>
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
