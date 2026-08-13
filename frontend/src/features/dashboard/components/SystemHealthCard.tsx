import React from 'react';
import { Server, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { SystemHealthStatus, HealthStatusLevel } from '../types';

interface SystemHealthCardProps {
  health: SystemHealthStatus;
  isLoading?: boolean;
}

const STATUS_ICONS: Record<
  HealthStatusLevel,
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  connected: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    label: 'Operational',
  },
  degraded: {
    icon: AlertCircle,
    color: 'text-amber-400',
    label: 'Degraded',
  },
  unhealthy: {
    icon: XCircle,
    color: 'text-red-400',
    label: 'Offline',
  },
  unknown: {
    icon: AlertCircle,
    color: 'text-zinc-500',
    label: 'Unknown',
  },
};

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({
  health,
  isLoading = false,
}) => {
  if (isLoading) {
    return null; // Handled by DashboardSkeleton
  }

  const services: Array<{ name: string; key: keyof SystemHealthStatus; details: string }> = [
    { name: 'Django REST Backend', key: 'backend', details: 'API v1 • JWT Auth' },
    { name: 'PostgreSQL Primary DB', key: 'database', details: 'Pool: 10/10 active' },
    { name: 'Redis Cache & Broker', key: 'redis', details: 'PubSub • EventQueue' },
    { name: 'Celery Async Workers', key: 'celery', details: 'Queue: 0 pending' },
    { name: 'AI Intelligence Engine', key: 'aiEngine', details: 'OpenAI / Ollama ready' },
    { name: 'Knowledge Vector Index', key: 'knowledgeEngine', details: 'FAISS • RAG Indexer' },
  ];

  const overallBadge =
    health.status === 'healthy'
      ? { text: 'HEALTHY', class: 'bg-emerald-950 text-emerald-400 border-emerald-800' }
      : health.status === 'degraded'
        ? { text: 'DEGRADED', class: 'bg-amber-950 text-amber-400 border-amber-800' }
        : { text: 'UNHEALTHY', class: 'bg-red-950 text-red-400 border-red-800' };

  return (
    <Card hoverEffect={false} className="h-full flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-subtle">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" /> Platform Infrastructure Health
            </CardTitle>
            <CardDescription>Real-time cluster & service telemetry</CardDescription>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${overallBadge.class}`}
            role="status"
            aria-label={`Overall platform health: ${overallBadge.text}`}
          >
            {overallBadge.text}
          </span>
        </div>
      </CardHeader>

      <div
        className="p-4 space-y-3 flex-1 overflow-y-auto"
        role="region"
        aria-label="Service health indicators"
      >
        {services.map((svc) => {
          const val = health[svc.key] as HealthStatusLevel;
          const iconConfig = STATUS_ICONS[val] || STATUS_ICONS.unknown;
          const Icon = iconConfig.icon;

          return (
            <div
              key={svc.name}
              tabIndex={0}
              role="article"
              aria-label={`${svc.name}: ${iconConfig.label}`}
              className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated/40 hover:bg-surface-elevated/70 transition-colors"
            >
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">{svc.name}</span>
                <span className="text-[10px] font-mono text-zinc-500">{svc.details}</span>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-xs">
                <Icon className={`w-3.5 h-3.5 ${iconConfig.color}`} />
                <span className={iconConfig.color}>{iconConfig.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2 border-t border-subtle text-[10px] font-mono text-zinc-500 flex items-center justify-between">
        <span>Last Ping: UTC</span>
        <span>
          {new Date(health.lastChecked).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      </div>
    </Card>
  );
};

export default SystemHealthCard;
