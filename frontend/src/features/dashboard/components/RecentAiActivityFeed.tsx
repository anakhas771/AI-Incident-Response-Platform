import React from 'react';
import { Sparkles, BrainCircuit, ShieldAlert, FileText, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { RecentAiActivityItem, AiActivityType } from '../types';
import { cn } from '../../../utils/cn';

interface RecentAiActivityFeedProps {
  activities: RecentAiActivityItem[];
  isLoading?: boolean;
}

const AI_TYPE_CONFIG: Record<
  AiActivityType,
  {
    label: string;
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
    dotColor: string;
  }
> = {
  RCA: {
    label: 'ROOT CAUSE',
    badgeClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60',
    icon: BrainCircuit,
    dotColor: 'bg-indigo-400',
  },
  RECOMMENDATION: {
    label: 'REMEDIATION',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
    icon: CheckCircle,
    dotColor: 'bg-emerald-400',
  },
  SUMMARY: {
    label: 'COPILOT',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60',
    icon: FileText,
    dotColor: 'bg-cyan-400',
  },
  TRIAGE: {
    label: 'AUTO TRIAGE',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-800/60',
    icon: ShieldAlert,
    dotColor: 'bg-purple-400',
  },
};

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const RecentAiActivityFeed: React.FC<RecentAiActivityFeedProps> = ({
  activities,
  isLoading = false,
}) => {
  if (isLoading) return null;

  return (
    <Card
      aiGlow
      hoverEffect={false}
      className="flex flex-col bg-surface border-indigo-500/[0.12]"
    >
      <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b border-white/[0.05] pb-3">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            AI Copilot Intelligence
          </CardTitle>
          <CardDescription className="mt-0.5">
            Live sessions, RCA, and remediation
          </CardDescription>
        </div>

        {/* LIVE indicator */}
        <div className="shrink-0 flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-live-blink" />
          <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
            Live
          </span>
        </div>
      </CardHeader>

      <div
        className="min-h-0 flex-1 overflow-y-auto divide-y divide-white/[0.04]"
        role="feed"
        aria-label="Recent AI intelligence activity"
      >
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/[0.07]">
              <Sparkles className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="text-xs font-mono text-zinc-500">No recent AI investigations</p>
            <p className="mt-1 text-[10px] text-zinc-700 max-w-[200px] mx-auto leading-relaxed">
              AI activity will appear here as incidents are investigated
            </p>
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
                aria-label={`${config.label}: ${item.title}`}
                className="px-4 py-3 space-y-2 transition-colors hover:bg-white/[0.02] focus:bg-white/[0.03] focus:outline-none"
              >
                {/* Header row */}
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {/* Type badge */}
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider',
                        config.badgeClass
                      )}
                    >
                      <Icon className="h-2.5 w-2.5" />
                      {config.label}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <span className="shrink-0 text-[10px] font-mono text-zinc-700">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>

                {/* Title */}
                <p className="text-xs font-semibold text-zinc-300 truncate leading-tight">
                  {item.title}
                </p>

                {/* Description */}
                <p className="text-[11px] leading-relaxed text-zinc-500 line-clamp-2 break-words">
                  {item.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dotColor)}
                    />
                    <span className="text-[9px] font-mono text-zinc-700 truncate">
                      {isCopilot ? `Session` : `INC-${item.incidentId.slice(-6)}`}
                    </span>
                  </div>

                  {/* Confidence */}
                  {!isCopilot && item.confidence > 0 && (
                    <span
                      className={cn(
                        'shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold',
                        item.confidence >= 70
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : item.confidence >= 40
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                      )}
                    >
                      {item.confidence}%
                    </span>
                  )}

                  {isCopilot && (
                    <span className="shrink-0 rounded border border-cyan-800/30 bg-cyan-950/40 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-400">
                      SESSION
                    </span>
                  )}
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
