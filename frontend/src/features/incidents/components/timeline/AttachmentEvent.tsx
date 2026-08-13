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
      icon={<Paperclip className="w-4 h-4 text-zinc-400" />}
      iconBg="bg-zinc-900"
      variant="user"
    />
  );
});

AttachmentEvent.displayName = 'AttachmentEvent';
