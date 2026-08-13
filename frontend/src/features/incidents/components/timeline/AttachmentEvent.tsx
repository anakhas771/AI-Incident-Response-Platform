import React from 'react';
import { Paperclip } from 'lucide-react';
import { IncidentTimelineItem } from '../../types';
import { TimelineEventItem } from './TimelineEventItem';

export interface AttachmentEventProps {
  item: IncidentTimelineItem;
}

export const AttachmentEvent: React.FC<AttachmentEventProps> = React.memo(({ item }) => {
  return (
    <TimelineEventItem
      item={item}
      icon={<Paperclip className="w-4 h-4 text-emerald-400" />}
      iconBg="bg-emerald-950/80"
    />
  );
});

AttachmentEvent.displayName = 'AttachmentEvent';
