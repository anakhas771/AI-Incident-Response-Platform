import React from 'react';
import { Shield, UserCheck } from 'lucide-react';
import { IncidentAuditLog } from '../types';

export interface AuditTrailPanelProps {
  auditTrail: IncidentAuditLog[];
}

export const AuditTrailPanel: React.FC<AuditTrailPanelProps> = React.memo(({ auditTrail }) => {
  return (
    <div className="bg-surface border border-subtle rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-subtle">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Immutable Security Audit Trail ({auditTrail.length})
          </h3>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
        {auditTrail.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500 font-mono italic">
            No audit log entries recorded.
          </div>
        ) : (
          auditTrail.map((item) => (
            <div
              key={item.id}
              tabIndex={0}
              aria-label={`Audit log: ${item.action_type} - ${item.description}`}
              className="p-3.5 rounded-lg bg-surface-elevated border border-subtle hover:border-zinc-700 transition-colors space-y-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400 uppercase">
                    {item.action_type}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500">
                    {new Date(item.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                {item.actor ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                    <UserCheck className="w-3 h-3 text-indigo-400" />
                    <span>{item.actor.full_name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">({item.actor.role})</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-900/50 px-2 py-0.2 rounded">
                    SYSTEM AI ENGINE
                  </span>
                )}
              </div>

              <p className="text-zinc-300 leading-relaxed font-normal">{item.description}</p>

              {(item.old_value !== undefined || item.new_value !== undefined) && (
                <div className="flex items-center gap-3 text-[10px] font-mono pt-1 text-zinc-400">
                  {item.old_value !== undefined && (
                    <span>
                      Previous: <strong className="text-red-400">{item.old_value}</strong>
                    </span>
                  )}
                  {item.new_value !== undefined && (
                    <span>
                      New: <strong className="text-emerald-400">{item.new_value}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Render IP address ONLY if returned by backend */}
              {item.ip_address && (
                <div className="text-[9px] font-mono text-zinc-500 pt-0.5">
                  IP Origin: {item.ip_address}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

AuditTrailPanel.displayName = 'AuditTrailPanel';
