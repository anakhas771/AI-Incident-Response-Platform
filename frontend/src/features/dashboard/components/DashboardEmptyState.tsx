import React from 'react';
import { Shield, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface DashboardEmptyStateProps {
  onReportIncident?: () => void;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  onReportIncident,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Icon container */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-emerald-500/[0.08] blur-2xl scale-150" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07]">
          <Shield className="h-7 w-7 text-emerald-400" />
        </div>
      </div>

      {/* Status badge */}
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1 text-[11px] font-medium text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-live-blink" />
        All systems operational
      </div>

      <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
        No active incidents
      </h2>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 leading-relaxed">
        Your organization is operating normally. Security posture is healthy across all
        monitored systems.
      </p>

      {onReportIncident && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReportIncident}
          className="mt-6"
          aria-label="Report a new incident"
        >
          <Plus className="h-3.5 w-3.5" />
          Report an incident
        </Button>
      )}
    </div>
  );
};

export default DashboardEmptyState;
