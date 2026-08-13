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
      icon={<MessageSquare className="w-4 h-4 text-indigo-400" />}
      iconBg="bg-indigo-950/80"
    />
  );
});

CommentEvent.displayName = 'CommentEvent';
