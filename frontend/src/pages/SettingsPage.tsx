import React, { useState } from 'react';
import { Settings, Key, Webhook, Check, Copy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../import Button from "../components/ui/button";';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('sk_live_sec_88492049182390123849102394019234');
  const [copied, setCopied] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success('API key copied to clipboard', {
      style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateKey = () => {
    const newKey =
      'sk_live_sec_' +
      Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setApiKey(newKey);
    toast.success('Generated new API Key', {
      style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" /> Platform & Security Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Manage API keys, notification channels, and automated security policies
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card hoverEffect={false}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" /> Enterprise REST API Keys
            </CardTitle>
            <CardDescription>
              Use API keys for authenticating automated incident ingestion scripts
            </CardDescription>
          </CardHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <input
                type="text"
                readOnly
                value={apiKey}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 font-mono text-xs text-zinc-300"
              />
              <Button size="sm" variant="secondary" onClick={handleCopyKey}>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleGenerateKey}>
                Regenerate
              </Button>
            </div>
          </div>
        </Card>

        <Card hoverEffect={false}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Webhook className="w-4 h-4 text-emerald-400" /> Webhook Alert Integrations
            </CardTitle>
            <CardDescription>
              Configure automatic alert dispatch to PagerDuty, Slack, and SIEM platforms
            </CardDescription>
          </CardHeader>
          <div className="space-y-3 pt-2">
            {[
              {
                name: 'Slack Incident Alert Channel (#sec-incidents)',
                status: 'Connected',
                badge: 'Active',
              },
              {
                name: 'PagerDuty On-Call Integration (Service ID: P-8821)',
                status: 'Connected',
                badge: 'Active',
              },
              { name: 'Splunk HEC Log Exporter', status: 'Disabled', badge: 'Inactive' },
            ].map((channel) => (
              <div
                key={channel.name}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-subtle text-xs"
              >
                <span className="font-semibold text-zinc-200">{channel.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    channel.badge === 'Active'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-zinc-900 text-zinc-500'
                  }`}
                >
                  {channel.badge}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
