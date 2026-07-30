import React, { useState } from 'react';
import { Bell, Radio } from 'lucide-react';
import { Button } from '../import Button from "../components/ui/button";';
import toast from 'react-hot-toast';

interface AlertItem {
  id: string;
  source: string;
  signal: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  status: 'UNHANDLED' | 'TRIAGED' | 'SUPPRESSED';
}

const mockAlerts: AlertItem[] = [
  {
    id: 'alt-1029',
    source: 'AWS GuardDuty',
    signal: 'IAM/UnauthorizedAccess:EC2/TorrentClient',
    severity: 'CRITICAL',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'UNHANDLED',
  },
  {
    id: 'alt-1030',
    source: 'Datadog APM',
    signal: 'High p99 Latency Anomaly on /api/v1/auth/token',
    severity: 'HIGH',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    status: 'TRIAGED',
  },
  {
    id: 'alt-1031',
    source: 'Cloudflare WAF',
    signal: 'HTTP 429 Surge: Rate Limit Triggered #4092',
    severity: 'MEDIUM',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'UNHANDLED',
  },
  {
    id: 'alt-1032',
    source: 'Postgres RDS',
    signal: 'Disk IOPS Consumption > 92% Threshold',
    severity: 'LOW',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'SUPPRESSED',
  },
];

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts);

  const handleAcknowledge = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'TRIAGED' } : a)));
    toast.success(`Alert ${id} triaged and assigned to AI pipeline`, {
      style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" /> Real-time Alerts & Telemetry Queue
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Ingested signals from GuardDuty, Datadog, Cloudflare, and K8s API
          </p>
        </div>
      </div>

      <div className="bg-surface border border-subtle rounded-xl overflow-hidden shadow-xl">
        <div className="divide-y divide-subtle">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-elevated/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/40 text-red-400 shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-bold text-zinc-200">{alert.source}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">{alert.id}</span>
                  </div>
                  <h3 className="text-xs font-semibold text-zinc-100 mt-1">{alert.signal}</h3>
                  <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    alert.status === 'UNHANDLED'
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {alert.status}
                </span>
                {alert.status === 'UNHANDLED' && (
                  <Button size="sm" variant="secondary" onClick={() => handleAcknowledge(alert.id)}>
                    Triage Alert
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
