import React from 'react';
import { IncidentTimelineItem } from '../../types';

export interface TimelineEventItemProps {
  item: IncidentTimelineItem;
  icon: React.ReactNode;
  iconBg: string;
  variant?: 'default' | 'system' | 'ai' | 'user';
  children?: React.ReactNode;
}

export const TimelineEventItem: React.FC<TimelineEventItemProps> = React.memo(
  ({ item, icon, iconBg, variant = 'default', children }) => {
    let containerClasses =
      'group relative flex gap-x-4 p-3 rounded-lg border transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ';
    switch (variant) {
      case 'system':
        containerClasses += 'border-transparent bg-transparent hover:bg-zinc-900/50 opacity-90';
        break;
      case 'user':
        containerClasses += 'bg-surface-elevated border-subtle hover:border-zinc-700 shadow-sm';
        break;
      case 'ai':
        containerClasses += 'bg-cyan-950/10 border-cyan-900/30 hover:border-cyan-800/50';
        break;
      default:
        containerClasses += 'border-transparent hover:border-subtle hover:bg-surface-elevated/50';
    }

    return (
      <div
        tabIndex={0}
        aria-label={`Timeline event: ${item.title} at ${new Date(item.timestamp).toLocaleTimeString()}`}
        className={containerClasses}
      >
        {/* Timeline Connecting Line */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg} border border-subtle z-10 text-zinc-100 shadow-sm`}
          >
            {icon}
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-zinc-200 tracking-tight">{item.title}</h4>
            <span className="text-[10px] font-mono text-zinc-500">
              {new Date(item.timestamp).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed font-normal">{item.message}</p>

          {item.actor && (
            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-zinc-500 font-mono">
              <span>Actor:</span>
              <span className="text-zinc-300 font-medium">{item.actor.full_name}</span>
              {item.actor.role && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-indigo-400">
                  {item.actor.role}
                </span>
              )}
            </div>
          )}

          {children}
        </div>
      </div>
    );
  }
);

TimelineEventItem.displayName = 'TimelineEventItem';
