import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  AlertTriangle,
  BarChart3,
  Users,
  Settings,
  Plus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useCommandStore } from '../../store/useCommandStore';
import { useIncidentStore } from '../../store/useIncidentStore';
import { Modal } from '../ui/Modal';
import { SeverityBadge } from '../ui/Badge';

export const CommandPalette: React.FC = () => {
  const { isCommandOpen, setCommandOpen, setCreateModalOpen } = useCommandStore();
  const { incidents } = useIncidentStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(!isCommandOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandOpen, setCommandOpen]);

  const handleSelect = (action: () => void) => {
    setCommandOpen(false);
    setQuery('');
    action();
  };

  const filteredIncidents = incidents.filter(
    (inc) =>
      inc.title.toLowerCase().includes(query.toLowerCase()) ||
      inc.id.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal isOpen={isCommandOpen} onClose={() => setCommandOpen(false)} maxWidth="xl">
      <div className="-m-5 -mt-6 sm:-m-6">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800 bg-surface-elevated/50">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search incidents..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
            autoFocus
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          <div>
            <p className="px-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Quick Actions
            </p>
            <div className="space-y-0.5">
              <button
                onClick={() => handleSelect(() => setCreateModalOpen(true))}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-red-400" />
                  <span>Report New Incident</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-zinc-400 transition-opacity" />
              </button>
              <button
                onClick={() => handleSelect(() => navigate('/ai-assistant'))}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-indigo-300 hover:bg-indigo-950/50 hover:text-indigo-200 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Launch AI Security Copilot</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity" />
              </button>
            </div>
          </div>

          <div>
            <p className="px-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Navigation
            </p>
            <div className="space-y-0.5">
              {[
                { label: 'Dashboard', path: '/', icon: LayoutDashboard },
                { label: 'Incidents Queue', path: '/incidents', icon: AlertTriangle },
                { label: 'Analytics & SLA Metrics', path: '/analytics', icon: BarChart3 },
                { label: 'Team Members', path: '/team', icon: Users },
                { label: 'Platform Settings', path: '/settings', icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelect(() => navigate(item.path))}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-zinc-400" />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-zinc-400 transition-opacity" />
                  </button>
                );
              })}
            </div>
          </div>

          {filteredIncidents.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Incidents ({filteredIncidents.length})
              </p>
              <div className="space-y-0.5">
                {filteredIncidents.map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => handleSelect(() => navigate(`/incidents/${inc.id}`))}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <SeverityBadge severity={inc.severity} showDot={false} />
                      <span className="truncate font-medium">{inc.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 shrink-0">{inc.id}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
