import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

interface DashboardErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export const DashboardErrorState: React.FC<DashboardErrorStateProps> = ({ error, onRetry }) => {
  return (
    <Card hoverEffect={false} className="p-12 text-center max-w-xl mx-auto my-12 border-red-900/50">
      <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800/60 text-red-400 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <h3 className="text-base font-semibold text-zinc-100 mb-2">
        Failed to load Enterprise Dashboard
      </h3>

      <p className="text-xs text-zinc-400 font-mono mb-6 max-w-md mx-auto">{error}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          aria-label="Retry loading dashboard data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      )}
    </Card>
  );
};

export default DashboardErrorState;
