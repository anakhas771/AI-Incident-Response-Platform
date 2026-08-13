import React from 'react';
import { ShieldCheck, Plus } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

interface DashboardEmptyStateProps {
  onReportIncident?: () => void;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({ onReportIncident }) => {
  return (
    <Card hoverEffect={false} className="p-16 text-center max-w-2xl mx-auto my-12">
      <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mx-auto mb-6">
        <ShieldCheck className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-semibold text-zinc-100 mb-2">
        All Systems Normal — Zero Active Incidents
      </h3>

      <p className="text-xs text-zinc-400 font-mono mb-8 max-w-md mx-auto leading-relaxed">
        No incidents have been logged in this queue. Telemetry monitors are actively scanning API
        gateways, databases, and cluster health.
      </p>

      {onReportIncident && (
        <button
          type="button"
          onClick={onReportIncident}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-lg shadow-indigo-600/20"
          aria-label="Report a new incident"
        >
          <Plus className="w-4 h-4" />
          <span>Report Incident</span>
        </button>
      )}
    </Card>
  );
};

export default DashboardEmptyState;
