import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MoreVertical, MessageSquare, Paperclip } from 'lucide-react';
import { useIncidentStore } from '../stores/useIncidentStore';
import { useCommandStore } from '../stores/useCommandStore';
import { useAuthStore } from '../stores/useAuthStore';
import { usePermissions } from '../hooks/usePermissions';
import { SeverityBadge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Category, Severity, Status } from '../types';

export const IncidentsPage: React.FC = () => {
  const {
    incidents,
    filters,
    setFilters,
    setSelectedIncident,
    updateStatus,
    loadIncidents,
  } = useIncidentStore();
  const { setCreateModalOpen } = useCommandStore();
  const { user } = useAuthStore();
  const { canUpdateIncidents } = usePermissions();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortField] = useState<'created_at' | 'severity' | 'status'>('created_at');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        await loadIncidents();
      } catch (error) {
        if (!mounted) return;
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          setLoadError('Your session has expired. Please sign in again.');
        } else if (status === 403) {
          setLoadError('You do not have access to your organization incidents.');
        } else {
          setLoadError('Unable to load organization incidents. Please refresh and try again.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [loadIncidents]);

  const filtered = incidents.filter((inc) => {
    if (filters.severity !== 'ALL' && inc.severity !== filters.severity) return false;
    if (filters.status !== 'ALL' && inc.status !== filters.status) return false;
    if (filters.category !== 'ALL' && inc.category !== filters.category) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!inc.title.toLowerCase().includes(q) && !inc.id.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortField === 'created_at') {
      const tA = new Date(a.created_at).getTime();
      const tB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? tB - tA : tA - tB;
    }
    return 0;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === sorted.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sorted.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleBulkStatusChange = (newStatus: Status) => {
    if (!user) return;
    void Promise.all(selectedIds.map((id) => updateStatus(id, newStatus, user))).finally(() => {
      setSelectedIds([]);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            Incidents Management Queue
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-300">
              {sorted.length} Incidents
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Organization-wide incident queue with real-time status transitions
          </p>
        </div>

        {canUpdateIncidents && (
          <Button variant="default" size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Report Incident</span>
          </Button>
        )}
      </div>

      {loadError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {loadError}
        </div>
      )}

      <div className="p-4 rounded-xl bg-surface border border-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Search organization incidents..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ severity: e.target.value as Severity | 'ALL' })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Severity: All</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>
          </div>

          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value as Status | 'ALL' })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Status: All</option>
              <option value="OPEN">Open</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="IDENTIFIED">Identified</option>
              <option value="MITIGATING">Mitigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ category: e.target.value as Category | 'ALL' })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Category: All</option>
              <option value="Security">Security</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Application">Application</option>
              <option value="Database">Database</option>
              <option value="Network">Network</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {selectedIds.length > 0 && canUpdateIncidents && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-xs text-indigo-200">
            <span className="font-semibold">{selectedIds.length} incidents selected</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => handleBulkStatusChange('INVESTIGATING')}>
                Mark Investigating
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleBulkStatusChange('RESOLVED')}>
                Mark Resolved
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                Deselect
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-surface border border-subtle rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300 border-collapse">
            <thead className="bg-surface-elevated text-zinc-400 font-mono text-[11px] uppercase tracking-wider border-b border-subtle sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === sorted.length && sorted.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0"
                  />
                </th>
                <th className="py-3 px-4 w-28">Severity</th>
                <th className="py-3 px-4">Incident Details</th>
                <th className="py-3 px-4 w-32">Status</th>
                <th className="py-3 px-4 w-40">Assignee</th>
                <th className="py-3 px-4 w-36">Reported At</th>
                <th className="py-3 px-4 w-12 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {isLoading ? (
                <tr><td colSpan={7} className="py-14 text-center text-zinc-500 font-mono text-xs">Loading organization incidents...</td></tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono text-xs">
                    No incidents found in this organization.
                  </td>
                </tr>
              ) : (
                sorted.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => {
                      setSelectedIncident(inc);
                      navigate(`/incidents/${inc.id}`);
                    }}
                    className={`hover:bg-surface-elevated/60 transition-colors cursor-pointer group ${selectedIds.includes(inc.id) ? 'bg-indigo-950/30' : ''}`}
                  >
                    <td className="py-3.5 px-4" onClick={(e) => toggleSelectOne(inc.id, e)}>
                      <input type="checkbox" checked={selectedIds.includes(inc.id)} onChange={() => {}} className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0" />
                    </td>
                    <td className="py-3.5 px-4"><SeverityBadge severity={inc.severity} /></td>
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-zinc-500 font-bold">{inc.id}</span>
                          <h3 className="font-semibold text-zinc-100 group-hover:text-indigo-300 transition-colors truncate">{inc.title}</h3>
                        </div>
                        <p className="text-zinc-400 line-clamp-1 text-[11px] font-normal">{inc.description}</p>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono pt-0.5">
                          <span className="bg-zinc-800/60 px-1.5 py-0.5 rounded">{inc.category}</span>
                          {inc.comments_count ? <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {inc.comments_count}</span> : null}
                          {inc.attachments_count ? <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> {inc.attachments_count}</span> : null}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4"><StatusBadge status={inc.status} /></td>
                    <td className="py-3.5 px-4">
                      {inc.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] font-semibold text-zinc-300 shrink-0">
                            {(inc.assigned_to.full_name || inc.assigned_to.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-zinc-300 font-medium truncate">{inc.assigned_to.full_name || inc.assigned_to.email}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 italic font-mono text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                      {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                      {new Date(inc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedIncident(inc); navigate(`/incidents/${inc.id}`); }} className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IncidentsPage;
