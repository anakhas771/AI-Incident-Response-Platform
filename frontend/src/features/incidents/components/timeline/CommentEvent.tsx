import React from 'react';
import { MessageSquare } from 'lucide-react';
import { IncidentTimelineItem } from '../../types';
import { TimelineEventItem } from './TimelineEventItem';

export interface CommentEventProps {
  item: IncidentTimelineItem;
}

export const CommentEvent: React.FC<CommentEventProps> = React.memo(({ item }) => {
  return (
    <TimelineEventItem
      item={item}
      icon={<MessageSquare className="w-4 h-4 text-emerald-400" />}
      iconBg="bg-emerald-950/80"
      variant="user"
    />
  );
});

CommentEvent.displayName = 'CommentEvent';
