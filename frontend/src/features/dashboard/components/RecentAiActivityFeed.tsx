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
    label: 'COPILOT',
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
    return null;
  }

  return (
    <Card aiGlow hoverEffect={false} className="flex h-full min-h-0 flex-col">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b border-subtle pb-3">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Sparkles className="h-4 w-4 text-indigo-400" /> Recent AI Copilot Intelligence
          </CardTitle>
          <CardDescription>Live Copilot sessions, RCA, and remediation intelligence</CardDescription>
        </div>
        <span className="shrink-0 rounded border border-emerald-800 bg-emerald-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
          LIVE
        </span>
      </CardHeader>

      <div
        className="min-h-0 flex-1 overflow-y-auto divide-y divide-subtle"
        role="feed"
        aria-label="Recent AI intelligence activity feed"
      >
        {activities.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-zinc-400">
            No recent Copilot intelligence yet.
          </div>
        ) : (
          activities.map((item) => {
            const config = AI_TYPE_CONFIG[item.type] || AI_TYPE_CONFIG.SUMMARY;
            const Icon = config.icon;
            const isCopilot = item.source === 'copilot';

            return (
              <div
                key={item.id}
                tabIndex={0}
                role="article"
                aria-label={`${config.label}: ${item.description}`}
                className="min-w-0 space-y-2 p-4 transition-colors hover:bg-surface-elevated/40 focus:bg-surface-elevated/60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-mono font-bold ${config.badgeClass}`}
                    >
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </span>
                    <span className="min-w-0 truncate text-xs font-semibold text-zinc-200">
                      {item.title}
                    </span>
                  </div>

                  {isCopilot ? (
                    <span className="shrink-0 rounded border border-cyan-800/50 bg-cyan-950/40 px-1.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                      SESSION
                    </span>
                  ) : (
                    <span className="shrink-0 rounded border border-emerald-800/40 bg-emerald-950/50 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                      {item.confidence}% Conf
                    </span>
                  )}
                </div>

                <p className="break-words text-xs leading-relaxed text-zinc-400 line-clamp-3">
                  {item.description}
                </p>

                <div className="flex min-w-0 items-center justify-between gap-2 text-[10px] font-mono text-zinc-500">
                  <span className="min-w-0 truncate">
                    {isCopilot ? `Session: ${item.incidentId}` : `Incident ID: ${item.incidentId}`}
                  </span>
                  <span className="shrink-0">
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
