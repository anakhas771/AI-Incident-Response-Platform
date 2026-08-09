import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { IncidentTimelineItem } from '../../types';
import { TimelineEventItem } from './TimelineEventItem';

export interface AIEventProps {
  item: IncidentTimelineItem;
}

export const AIEvent: React.FC<AIEventProps> = React.memo(({ item }) => {
  return (
    <TimelineEventItem
      item={item}
      icon={<Bot className="w-4 h-4 text-cyan-400" />}
      iconBg="bg-cyan-950/80"
    >
      <div className="mt-2 p-2.5 rounded-md bg-cyan-950/30 border border-cyan-900/40 text-[11px] text-cyan-200 flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-cyan-300">AI Autonomous Diagnostic:</span> Analyzed
          log signatures and correlated upstream telemetry.
        </div>
      </div>
    </TimelineEventItem>
  );
});

AIEvent.displayName = 'AIEvent';
