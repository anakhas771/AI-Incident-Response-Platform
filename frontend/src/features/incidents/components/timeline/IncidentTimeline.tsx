import React, { useMemo } from 'react';
import { Filter, History } from 'lucide-react';
import { IncidentTimelineItem, TimelineEventType } from '../../types';
import { AIEvent } from './AIEvent';
import { AttachmentEvent } from './AttachmentEvent';
import { CommentEvent } from './CommentEvent';
import { StatusEvent } from './StatusEvent';
import { SystemEvent } from './SystemEvent';

export interface IncidentTimelineProps {
  timeline: IncidentTimelineItem[];
  filterType?: TimelineEventType | 'ALL';
  onlyAI?: boolean;
  onFilterChange?: (filter: TimelineEventType | 'ALL') => void;
  onToggleOnlyAI?: () => void;
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = React.memo(
  ({ timeline, filterType = 'ALL', onlyAI = false, onFilterChange, onToggleOnlyAI }) => {
    const filteredTimeline = useMemo(() => {
      return timeline.filter((item) => {
        if (onlyAI && item.event_type !== 'AI_ANALYSIS' && item.event_type !== 'RECOMMENDATION') {
          return false;
        }
        if (filterType !== 'ALL' && item.event_type !== filterType) {
          return false;
        }
        return true;
      });
    }, [timeline, filterType, onlyAI]);

    const renderEvent = (item: IncidentTimelineItem) => {
      switch (item.event_type) {
        case 'AI_ANALYSIS':
        case 'RECOMMENDATION':
          return <AIEvent key={item.id} item={item} />;
        case 'COMMENT_ADDED':
          return <CommentEvent key={item.id} item={item} />;
        case 'ATTACHMENT':
          return <AttachmentEvent key={item.id} item={item} />;
        case 'STATUS_CHANGED':
        case 'SEVERITY_CHANGED':
          return <StatusEvent key={item.id} item={item} />;
        case 'CREATED':
        case 'SYSTEM_ALERT':
        default:
          return <SystemEvent key={item.id} item={item} />;
      }
    };

    return (
      <div className="bg-surface border border-subtle rounded-xl p-5 space-y-4 shadow-sm">
        {/* Timeline Header & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-subtle">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Chronological Audit Feed ({filteredTimeline.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={onToggleOnlyAI}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors border ${
                onlyAI
                  ? 'bg-cyan-950/80 border-cyan-700 text-cyan-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ⚡ AI Engine Only
            </button>

            {onFilterChange && (
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md px-2 py-0.5">
                <Filter className="w-3 h-3 text-zinc-500" />
                <select
                  value={filterType}
                  onChange={(e) => onFilterChange(e.target.value as TimelineEventType | 'ALL')}
                  className="bg-transparent text-[11px] font-mono text-zinc-300 focus:outline-none"
                  aria-label="Filter timeline events"
                >
                  <option value="ALL" className="bg-zinc-900 text-zinc-300">
                    All Events
                  </option>
                  <option value="CREATED" className="bg-zinc-900 text-zinc-300">
                    Created
                  </option>
                  <option value="STATUS_CHANGED" className="bg-zinc-900 text-zinc-300">
                    Status Changes
                  </option>
                  <option value="ASSIGNED" className="bg-zinc-900 text-zinc-300">
                    Assignments
                  </option>
                  <option value="COMMENT_ADDED" className="bg-zinc-900 text-zinc-300">
                    Comments
                  </option>
                  <option value="AI_ANALYSIS" className="bg-zinc-900 text-zinc-300">
                    AI Triage
                  </option>
                  <option value="ATTACHMENT" className="bg-zinc-900 text-zinc-300">
                    Attachments
                  </option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Virtualized / Scrollable Container */}
        <div
          role="feed"
          aria-label="Incident chronological timeline feed"
          className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800"
        >
          {filteredTimeline.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono italic">
              No timeline events recorded matching the current filter.
            </div>
          ) : (
            filteredTimeline.map(renderEvent)
          )}
        </div>
      </div>
    );
  }
);

IncidentTimeline.displayName = 'IncidentTimeline';
