import React from 'react';
import { Activity } from 'lucide-react';
import { mockActivityLogs } from '../services/mockData';

export const ActivityLogPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" /> Platform Security Audit Trail
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">Immutable audit log recording user actions, IP origins, and system modifications</p>
      </div>

      <div className="bg-surface border border-subtle rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-surface-elevated text-zinc-400 font-mono text-[11px] uppercase tracking-wider border-b border-subtle">
            <tr>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Target Resource</th>
              <th className="py-3 px-4">IP Address</th>
              <th className="py-3 px-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {mockActivityLogs.map((log) => (
              <tr key={log.id} className="hover:bg-surface-elevated/50 transition-colors font-mono text-xs">
                <td className="py-3.5 px-4 font-sans font-medium text-zinc-100">{log.user.full_name}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-200">
                    {log.action}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-indigo-400">{log.target}</td>
                <td className="py-3.5 px-4 text-zinc-400">{log.ip_address}</td>
                <td className="py-3.5 px-4 text-zinc-500">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogPage;
