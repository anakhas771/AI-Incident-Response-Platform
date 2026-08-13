import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { IncidentTimelineItem } from '../../types';
import { TimelineEventItem } from './TimelineEventItem';

export interface StatusEventProps {
  item: IncidentTimelineItem;
}

export const StatusEvent: React.FC<StatusEventProps> = React.memo(({ item }) => {
  return (
    <TimelineEventItem
      item={item}
      icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
      iconBg="bg-zinc-900"
      variant="user"
    />
  );
});

StatusEvent.displayName = 'StatusEvent';
