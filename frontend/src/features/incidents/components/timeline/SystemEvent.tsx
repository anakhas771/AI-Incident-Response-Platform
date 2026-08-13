import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { IncidentTimelineItem } from '../../types';
import { TimelineEventItem } from './TimelineEventItem';

export interface SystemEventProps {
  item: IncidentTimelineItem;
}

export const SystemEvent: React.FC<SystemEventProps> = React.memo(({ item }) => {
  const isAlert = item.event_type === 'CREATED' || item.event_type === 'SYSTEM_ALERT';
  return (
    <TimelineEventItem
      item={item}
      icon={
        isAlert ? (
          <AlertTriangle className="w-4 h-4 text-red-400" />
        ) : (
          <ShieldAlert className="w-4 h-4 text-amber-400" />
        )
      }
      iconBg={isAlert ? 'bg-red-950/80' : 'bg-amber-950/80'}
    />
  );
});

SystemEvent.displayName = 'SystemEvent';
