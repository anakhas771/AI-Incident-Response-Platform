import React from 'react';
import { Sparkles, BrainCircuit, ShieldAlert, FileText, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { RecentAiActivityItem, AiActivityType } from '../types';

interface RecentAiActivityFeedProps {
  activities: RecentAiActivityItem[];
  isLoading?: boolean;
}

const AI_TYPE_CONFIG: Record<
  AiActivityType,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  RCA: {
    label: 'ROOT CAUSE',
    badgeClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-800',
    icon: BrainCircuit,
  },
  RECOMMENDATION: {
    label: 'ACTION SUGGESTED',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    icon: CheckCircle,
  },
  SUMMARY: {
    label: 'SUMMARY',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
    icon: FileText,
  },
  TRIAGE: {
    label: 'AUTO TRIAGE',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-800',
    icon: ShieldAlert,
  },
};

export const RecentAiActivityFeed: React.FC<RecentAiActivityFeedProps> = ({
  activities,
  isLoading = false,
}) => {
  if (isLoading) {
    return null; // Handled by DashboardSkeleton
  }

  return (
    <Card aiGlow hoverEffect={false} className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-subtle">
        <div>
          <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Recent AI Copilot Intelligence
          </CardTitle>
          <CardDescription>Live automated RCA & remediation recommendations</CardDescription>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
          ACTIVE
        </span>
      </CardHeader>

      <div
        className="divide-y divide-subtle flex-1 overflow-y-auto"
        role="feed"
        aria-label="Recent AI intelligence activity feed"
      >
        {activities.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs font-mono">
            No recent AI Copilot activities logged.
          </div>
        ) : (
          activities.map((item) => {
            const config = AI_TYPE_CONFIG[item.type] || AI_TYPE_CONFIG.SUMMARY;
            const Icon = config.icon;

            return (
              <div
                key={item.id}
                tabIndex={0}
                role="article"
                aria-label={`${config.label} for incident ${item.incidentId}: ${item.description}`}
                className="p-4 space-y-2 hover:bg-surface-elevated/40 focus:bg-surface-elevated/60 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${config.badgeClass}`}
                    >
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                    <span className="text-xs font-semibold text-zinc-200 truncate max-w-[220px]">
                      {item.title}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                    {item.confidence}% Conf
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>Incident ID: {item.incidentId}</span>
                  <span>
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default RecentAiActivityFeed;
