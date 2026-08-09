import React from 'react';
import { Server, Terminal } from 'lucide-react';
import { SystemMetadata } from '../types';

export interface SystemMetadataPanelProps {
  metadata: SystemMetadata | null;
}

export const SystemMetadataPanel: React.FC<SystemMetadataPanelProps> = React.memo(
  ({ metadata }) => {
    if (!metadata) return null;

    return (
      <div className="bg-surface border border-subtle rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Server className="w-4 h-4 text-indigo-400" /> Infrastructure & Telemetry Context
        </h3>

        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-zinc-950/60 border border-zinc-800 p-2.5 rounded-lg space-y-0.5">
            <div className="text-[10px] text-zinc-500 uppercase">Environment</div>
            <div className="font-bold text-zinc-200">{metadata.environment}</div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800 p-2.5 rounded-lg space-y-0.5">
            <div className="text-[10px] text-zinc-500 uppercase">Cloud Region</div>
            <div className="font-bold text-zinc-200">{metadata.region}</div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800 p-2.5 rounded-lg space-y-0.5">
            <div className="text-[10px] text-zinc-500 uppercase">Kubernetes Namespace</div>
            <div className="font-bold text-indigo-400 truncate">
              {metadata.kubernetes_namespace}
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800 p-2.5 rounded-lg space-y-0.5">
            <div className="text-[10px] text-zinc-500 uppercase">Cluster Identifier</div>
            <div className="font-bold text-zinc-200 truncate">{metadata.cluster_id}</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-[11px] font-mono text-zinc-400 uppercase flex items-center gap-1">
            <Terminal className="w-3 h-3 text-zinc-500" /> Impacted Services (
            {metadata.impacted_services.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {metadata.impacted_services.map((svc, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300"
              >
                {svc}
              </span>
            ))}
          </div>
        </div>

        {metadata.last_deployed_at && (
          <div className="text-[10px] font-mono text-zinc-500 pt-2 border-t border-subtle/50">
            Last Revision Deployed: {new Date(metadata.last_deployed_at).toLocaleString()}
          </div>
        )}
      </div>
    );
  }
);

SystemMetadataPanel.displayName = 'SystemMetadataPanel';
