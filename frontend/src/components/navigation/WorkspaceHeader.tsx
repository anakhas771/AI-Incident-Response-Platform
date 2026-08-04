import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { ShieldCheck, Server, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { cn } from '../../utils/cn';

export interface WorkspaceHeaderProps {
  className?: string;
  environment?: 'PROD' | 'STAGING' | 'DEV';
  onRefresh?: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  className,
  environment = 'PROD',
  onRefresh,
}) => {
  const { organization } = useAuthStore();

  const envStyles = {
    PROD: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    STAGING: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
    DEV: 'bg-indigo-950/60 text-indigo-400 border-indigo-800/60',
  };

  return (
    <div
      className={cn(
        'w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-subtle',
        className
      )}
    >
      {/* Left: Workspace Context & Breadcrumbs */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Workspace:
          </span>
          <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{organization?.name || 'Enterprise Security Ops'}</span>
          </span>
          <span
            className={cn(
              'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border uppercase tracking-wider',
              envStyles[environment]
            )}
            title={`Active SOC Environment: ${environment}`}
          >
            {environment}
          </span>
        </div>
        <Breadcrumbs />
      </div>

      {/* Right: Environment & System Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-elevated border border-subtle text-xs text-zinc-400">
          <Server className="w-3.5 h-3.5 text-emerald-500" />
          <span>SOC Node:</span>
          <span className="font-mono text-zinc-200">us-east-1a</span>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface-hover text-zinc-400 hover:text-zinc-100 border border-subtle text-xs transition-colors"
            title="Refresh active workspace data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkspaceHeader;
