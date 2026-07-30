import React from 'react';
import { GitCommit, Clock, ShieldAlert } from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';
import { SeverityBadge } from '../components/ui/Badge';

export const TimelinePage: React.FC = () => {
  const { incidents } = useIncidentStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-indigo-400" /> Global Event Timeline Scrubber
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">Chronological audit stream of security events across all active incidents</p>
      </div>

      <div className="bg-surface border border-subtle rounded-xl p-6 relative">
        <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-zinc-800" />

        <div className="space-y-6 relative z-10">
          {incidents.map((inc, index) => (
            <div key={inc.id} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-indigo-400 shrink-0">
                {index === 0 ? <ShieldAlert className="w-4 h-4 text-red-400" /> : <Clock className="w-4 h-4 text-indigo-400" />}
              </div>

              <div className="flex-1 bg-surface-elevated border border-subtle rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={inc.severity} />
                    <span className="font-mono text-xs text-zinc-400 font-bold">{inc.id}</span>
                    <h3 className="text-xs font-semibold text-zinc-200">{inc.title}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {new Date(inc.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{inc.description}</p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500 pt-1">
                  <span>Category: {inc.category}</span>
                  <span>Assignee: {inc.assigned_to ? inc.assigned_to.full_name : 'Unassigned'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelinePage;
