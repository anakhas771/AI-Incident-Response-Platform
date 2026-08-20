import React from 'react';
import { ArrowLeft, CheckCircle2, RefreshCw, Share2, Sparkles } from 'lucide-react';
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
  aiStatus: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  isCopilotOpen: boolean;
  onTogglePolling: () => void;
  onManualRefresh: () => void;
  onStartAnalysis: () => void;
  onToggleCopilot: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = React.memo(
  ({
    incident,
    pollingEnabled,
    isRefreshing,
    lastUpdated,
    aiStatus,
    isCopilotOpen,
    onTogglePolling,
    onManualRefresh,
    onStartAnalysis,
    onToggleCopilot,
  }) => {
    const navigate = useNavigate();

    const handleCopyShareLink = () => {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Incident workspace link copied', {
        style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
      });
    };

    if (!incident) {
      return (
        <div className="border-b border-subtle pb-5">
          <button
            onClick={() => navigate('/incidents')}
            className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to incidents
          </button>
        </div>
      );
    }

    const analysisLabel =
      aiStatus === 'processing' || aiStatus === 'pending'
        ? 'Analysis in progress'
        : aiStatus === 'completed'
          ? 'Analysis ready'
          : aiStatus === 'failed'
            ? 'Analysis unavailable'
            : 'Analysis not run';

    return (
      <header className="border-b border-subtle pb-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => navigate('/incidents')}
              className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to incidents
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onTogglePolling}
                className="inline-flex items-center gap-2 rounded-lg border border-subtle bg-surface-elevated px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
                aria-label={pollingEnabled ? 'Disable live updates' : 'Enable live updates'}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${pollingEnabled ? 'bg-emerald-400' : 'bg-zinc-600'}`}
                />
                {pollingEnabled ? 'Live' : 'Paused'}
              </button>

              <button
                onClick={onManualRefresh}
                aria-label="Refresh workspace data"
                title="Refresh workspace data"
                className="rounded-lg border border-subtle bg-surface-elevated p-1.5 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`}
                />
              </button>

              <Button variant="secondary" size="sm" onClick={handleCopyShareLink}>
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={onToggleCopilot}
                className={isCopilotOpen ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : undefined}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isCopilotOpen ? 'Close Copilot' : 'Open Copilot'}
              </Button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] font-semibold tracking-wide text-zinc-500">
                  {incident.id}
                </span>
                <span className="h-3 w-px bg-zinc-800" />
                <SeverityBadge severity={incident.severity} />
                <StatusBadge status={incident.status} />
                <span className="text-xs text-zinc-500">{incident.category}</span>
              </div>

              <h1 className="max-w-4xl text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                {incident.title}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Reported by <span className="text-zinc-200">{incident.created_by.full_name}</span> ·{' '}
                {new Date(incident.created_at).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-3 lg:justify-end">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">AI analysis</p>
                <p className="mt-1 text-xs text-zinc-300">{analysisLabel}</p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-subtle bg-surface-elevated">
                {aiStatus === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : aiStatus === 'processing' || aiStatus === 'pending' ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                ) : (
                  <Sparkles className="h-4 w-4 text-zinc-500" />
                )}
              </div>

              {(aiStatus === 'idle' || aiStatus === 'failed') && (
                <button
                  onClick={onStartAnalysis}
                  className="text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                >
                  {aiStatus === 'failed' ? 'Retry analysis' : 'Run analysis'}
                </button>
              )}
            </div>
          </div>

          {lastUpdated && <p className="text-[11px] text-zinc-600">Last synced {lastUpdated}</p>}
        </div>
      </header>
    );
  }
);

WorkspaceHeader.displayName = 'WorkspaceHeader';

export default WorkspaceHeader;
