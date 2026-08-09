import React from 'react';
import { ArrowLeft, RefreshCw, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Incident } from '../../../../types';
import { SeverityBadge, StatusBadge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import toast from 'react-hot-toast';

export interface WorkspaceHeaderProps {
  incident: Incident | null;
  pollingEnabled: boolean;
  isRefreshing: boolean;
  lastUpdated: string | null;
  onTogglePolling: () => void;
  onManualRefresh: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = React.memo(
  ({ incident, pollingEnabled, isRefreshing, lastUpdated, onTogglePolling, onManualRefresh }) => {
    const navigate = useNavigate();

    const handleCopyShareLink = () => {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Incident workspace link copied to clipboard', {
        style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
      });
    };

    if (!incident) {
      return (
        <div className="flex items-center justify-between pb-4 border-b border-subtle">
          <button
            onClick={() => navigate('/incidents')}
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Incidents Queue
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-4 border-b border-subtle">
        {/* Navigation & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/incidents')}
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Incidents Queue
          </button>

          <div className="flex items-center gap-3">
            {/* Live Update Polling Status Indicator */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                onClick={onTogglePolling}
                className={`px-2.5 py-1 rounded-md border text-[11px] font-bold transition-all ${
                  pollingEnabled
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {pollingEnabled ? '🟢 Live Updates: ON' : '⚪ Live Updates: OFF'}
              </button>

              <button
                onClick={onManualRefresh}
                aria-label="Refresh workspace data"
                title="Manual refresh"
                className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`}
                />
              </button>

              {lastUpdated && (
                <span className="text-[10px] text-zinc-500">Updated: {lastUpdated}</span>
              )}
            </div>

            <Button variant="secondary" size="sm" onClick={handleCopyShareLink}>
              <Share2 className="w-3.5 h-3.5" /> Share Command Center
            </Button>
          </div>
        </div>

        {/* Incident Title & Meta */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
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

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400 pt-0.5">
            <span>
              Reported by:{' '}
              <strong className="text-zinc-200">{incident.created_by.full_name}</strong>
            </span>
            <span>•</span>
            <span>Created: {new Date(incident.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }
);

WorkspaceHeader.displayName = 'WorkspaceHeader';
