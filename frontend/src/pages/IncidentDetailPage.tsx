import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  Paperclip,
  Send,
  UploadCloud,
  FileText,
  Share2,
  Terminal,
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';
import { useAuthStore } from '../store/useAuthStore';
import { SeverityBadge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AISummaryCard } from '../components/ai/AISummaryCard';
import { Status } from '../types';
import { mockUsers } from '../services/mockData';
import toast from 'react-hot-toast';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { incidents, commentsMap, updateStatus, assignUser, addComment } = useIncidentStore();
  const { user } = useAuthStore();

  const incident = incidents.find((i) => i.id === id) || incidents[0];
  const [commentText, setCommentText] = useState('');
  const comments = commentsMap[incident.id] || [];

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    addComment(incident.id, commentText, user);
    setCommentText('');
  };

  const handleStatusChange = (newStatus: Status) => {
    if (!user) return;
    updateStatus(incident.id, newStatus, user);
  };

  const handleAssigneeChange = (userId: string) => {
    if (!user) return;
    const assignee = mockUsers.find((u) => u.id === userId) || null;
    assignUser(incident.id, assignee, user);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Incident link copied to clipboard', {
      style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-subtle">
        <button
          onClick={() => navigate('/incidents')}
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Incidents Queue
        </button>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleCopyShareLink}>
            <Share2 className="w-3.5 h-3.5" /> Share Incident
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
            {incident.id}
          </span>
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
          <span className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-2 py-0.5 rounded">
            {incident.category}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight leading-snug">
          {incident.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 pt-1">
          <span>Reported by: <strong className="text-zinc-200">{incident.created_by.full_name}</strong></span>
          <span>•</span>
          <span>Created: {new Date(incident.created_at).toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface border border-subtle rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> Technical Problem Description
            </h2>
            <p className="text-sm text-zinc-200 leading-relaxed font-normal">{incident.description}</p>

            <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-xs font-mono text-red-300/90 leading-relaxed overflow-x-auto">
              <div className="text-[10px] text-zinc-500 mb-1 flex items-center gap-1.5 border-b border-zinc-900 pb-1">
                <Terminal className="w-3 h-3 text-zinc-500" /> APISERVER_STDERR_STREAM
              </div>
              <pre>{`[ERROR] 2026-07-29T18:14:02.941Z auth-pod-789a: Failed to acquire DB lock within 5000ms.
[WARN]  Goroutine pool saturated: 1024/1024 active workers.
[FATAL] OOMKilled: Memory limit of 512Mi exceeded on /api/v1/auth/token endpoint.`}</pre>
            </div>
          </div>

          <div className="bg-surface border border-subtle rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" /> Team Discussion ({comments.length})
            </h2>

            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-3 font-mono">No comments posted yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-surface-elevated border border-subtle space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-200">{c.author.full_name}</span>
                        <span className="text-[10px] font-mono text-indigo-400">{c.author.role}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{c.message}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostComment} className="pt-2">
              <div className="relative">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add triage updates or technical findings..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="default"
                  disabled={!commentText.trim()}
                  className="absolute right-2 bottom-2.5"
                >
                  <Send className="w-3 h-3" /> Post
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-surface border border-subtle rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-emerald-400" /> Evidence & Attachments
            </h2>
            <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg p-6 text-center cursor-pointer transition-colors bg-zinc-950/40">
              <UploadCloud className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
              <p className="text-xs font-medium text-zinc-300">Drag & drop log files or pcap dumps</p>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">Supports .log, .json, .pcap, .png up to 50MB</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {incident.ai_summary && (
            <AISummaryCard summary={incident.ai_summary} incidentTitle={incident.title} />
          )}

          <div className="bg-surface border border-subtle rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Response Management Controls
            </h3>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                Transition Status
              </label>
              <select
                value={incident.status}
                onChange={(e) => handleStatusChange(e.target.value as Status)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="OPEN">OPEN (Needs Triage)</option>
                <option value="INVESTIGATING">INVESTIGATING (Under Analysis)</option>
                <option value="IDENTIFIED">IDENTIFIED (Root Cause Found)</option>
                <option value="MITIGATING">MITIGATING (Fix Applied)</option>
                <option value="RESOLVED">RESOLVED (Normal Ops)</option>
                <option value="CLOSED">CLOSED (Archived)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                Assign Incident Owner
              </label>
              <select
                value={incident.assigned_to?.id || ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {mockUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailPage;
