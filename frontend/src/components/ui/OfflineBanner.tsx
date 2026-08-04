import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full bg-amber-950/90 border-b border-amber-700/60 text-amber-200 px-4 py-2 flex items-center justify-between text-xs font-medium z-50 shrink-0"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        <span>
          <strong>Offline Mode Active:</strong> Network connection lost. AI Copilot responses and
          session syncing are paused until reconnected.
        </span>
      </div>
      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono bg-amber-900/60 px-2 py-0.5 rounded text-amber-300 border border-amber-700/50">
        <AlertTriangle className="w-3 h-3" />
        QUEUED
      </span>
    </div>
  );
};

export default OfflineBanner;
