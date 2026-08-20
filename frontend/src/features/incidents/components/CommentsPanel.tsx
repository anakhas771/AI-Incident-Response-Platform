import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Comment, User } from '../../../types';
import { Button } from '../../../components/ui/Button';

export interface CommentsPanelProps {
  comments: Comment[];
  currentUser: User | null;
  onPostComment: (message: string, author: User) => Promise<void>;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = React.memo(
  ({ comments, currentUser, onPostComment }) => {
    const [commentText, setCommentText] = useState('');
    const [posting, setPosting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!commentText.trim() || !currentUser) return;
      setPosting(true);

      try {
        await onPostComment(commentText.trim(), currentUser);
        setCommentText('');
      } catch (err) {
        console.error('Failed to post comment:', err);
      } finally {
        setPosting(false);
      }
    };

    return (
      <div className="bg-surface border border-subtle rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-subtle">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Analyst Incident Discussion ({comments.length})
            </h3>
          </div>
        </div>

        {/* Virtualized / Scrollable Comments List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {comments.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500 font-mono italic">
              No comments posted yet.
            </div>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-lg bg-surface-elevated border border-subtle space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-200">{c.author.full_name}</span>
                    <span className="text-[9px] font-mono text-indigo-400 px-1.5 py-0.2 rounded bg-indigo-950/60 border border-indigo-900/50">
                      {c.author.role}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {new Date(c.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-normal whitespace-pre-wrap">
                  {c.message}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Post Form */}
        <form onSubmit={handleSubmit} className="pt-2">
          <div className="relative">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add triage findings, WAF update logs, or coordination notes..."
              rows={2}
              aria-label="Write a comment"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <Button
              type="submit"
              size="sm"
              variant="default"
              disabled={!commentText.trim() || posting || !currentUser}
              className="absolute right-2 bottom-2.5"
            >
              <Send className="w-3 h-3" /> Post
            </Button>
          </div>
        </form>
      </div>
    );
  }
);

CommentsPanel.displayName = 'CommentsPanel';
