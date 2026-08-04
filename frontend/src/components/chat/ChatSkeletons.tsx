import React from 'react';

/**
 * Skeleton loading state for ConversationList sidebar sessions.
 */
export const ConversationListSkeleton: React.FC = () => {
  return (
    <div className="space-y-2 p-3 animate-pulse" aria-label="Loading conversations">
      {[1, 2, 3, 4, 5].map((idx) => (
        <div
          key={idx}
          className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/40 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-3/4 bg-zinc-800 rounded" />
            <div className="h-3 w-6 bg-zinc-800 rounded" />
          </div>
          <div className="h-2 w-1/2 bg-zinc-800/60 rounded" />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton loading state for AI Copilot message turn while connecting SSE.
 */
export const MessageBubbleSkeleton: React.FC = () => {
  return (
    <div
      className="flex gap-4 p-4 md:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 mr-4 md:mr-12 animate-pulse"
      aria-label="AI response loading"
    >
      {/* Avatar Shimmer */}
      <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-500/20 shrink-0" />

      {/* Message Content Shimmer */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-28 bg-zinc-800 rounded" />
          <div className="h-3 w-12 bg-indigo-950 rounded" />
        </div>
        <div className="space-y-2 pt-1">
          <div className="h-3 w-11/12 bg-zinc-800 rounded" />
          <div className="h-3 w-5/6 bg-zinc-800 rounded" />
          <div className="h-3 w-2/3 bg-zinc-800 rounded" />
        </div>
      </div>
    </div>
  );
};
