import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { RefreshCw, ShieldCheck } from 'lucide-react';
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
    PROD: 'bg-emerald-500/[0.06] text-emerald-300 border-emerald-500/15',
    STAGING: 'bg-amber-500/[0.06] text-amber-300 border-amber-500/15',
    DEV: 'bg-indigo-500/[0.06] text-indigo-300 border-indigo-500/15',
  };

  return (
    <div
      className={cn(
        'w-full flex items-center justify-between gap-4 pb-5 border-b border-white/[0.06]',
        className
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em]">
            Workspace
          </span>
          <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            <span className="truncate">{organization?.name || 'Enterprise Security Ops'}</span>
          </span>
          <span
            className={cn(
              'px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded border uppercase tracking-[0.14em]',
              envStyles[environment]
            )}
            title={`Active environment: ${environment}`}
          >
            {environment}
          </span>
        </div>
        <Breadcrumbs />
      </div>

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-100 border border-white/[0.07] text-xs transition-colors"
          title="Refresh active workspace data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      )}
    </div>
  );
};

export default WorkspaceHeader;
