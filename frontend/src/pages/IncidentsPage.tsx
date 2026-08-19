import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ArrowUpRight, MessageSquare, Paperclip, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIncidentStore } from '../stores/useIncidentStore';
import { useCommandStore } from '../stores/useCommandStore';
import { useAuthStore } from '../stores/useAuthStore';
import { usePermissions } from '../hooks/usePermissions';
import { SeverityBadge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Category, Severity, Status } from '../types';
import { cn } from '../utils/cn';

const SEVERITY_BAR: Record<Severity, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-emerald-500',
};

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
  const [showFilters, setShowFilters] = useState(false);

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
          setLoadError('Unable to load incidents. Please refresh and try again.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
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

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === sorted.length ? [] : sorted.map((i) => i.id));
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

  const hasActiveFilters =
    filters.severity !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.category !== 'ALL' ||
    filters.search !== '';

  return (
    <div className="min-w-0 space-y-5">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-50 flex items-center gap-3">
            Incident Queue
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono bg-white/[0.05] border border-white/[0.08] text-zinc-400 font-normal">
              {sorted.length}
            </span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            Organization-wide incident queue with real-time status transitions
          </p>
        </div>

        {canUpdateIncidents && (
          <Button variant="default" size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            Report Incident
          </Button>
        )}
      </motion.div>

      {/* ─── Error ───────────────────────────────────────────────────────── */}
      {loadError && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      )}

      {/* ─── Filter Bar ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.06] bg-surface p-3 space-y-3">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Search by title, ID, or keyword..."
              className="w-full bg-white/[0.025] border border-white/[0.06] rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.04] transition-colors"
            />
          </div>

          <Button
            variant={showFilters || hasActiveFilters ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            aria-label="Toggle filters"
            className={cn(hasActiveFilters && 'border-indigo-500/30 text-indigo-300')}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-indigo-500 text-white text-[9px] w-4 h-4 flex items-center justify-center font-bold">
                !
              </span>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ severity: 'ALL', status: 'ALL', category: 'ALL', search: '' })}
              aria-label="Clear all filters"
              className="text-zinc-600 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Expanded filter dropdowns */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({ severity: e.target.value as Severity | 'ALL' })}
                  className="w-full bg-white/[0.025] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none"
                >
                  <option value="ALL">Severity: All</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ status: e.target.value as Status | 'ALL' })}
                  className="w-full bg-white/[0.025] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none"
                >
                  <option value="ALL">Status: All</option>
                  <option value="OPEN">Open</option>
                  <option value="INVESTIGATING">Investigating</option>
                  <option value="IDENTIFIED">Identified</option>
                  <option value="MITIGATING">Mitigating</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ category: e.target.value as Category | 'ALL' })}
                  className="w-full bg-white/[0.025] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none"
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk action bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && canUpdateIncidents && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-950/50 border border-indigo-800/40 text-xs text-indigo-200">
                <span className="font-semibold">{selectedIds.length} selected</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleBulkStatusChange('INVESTIGATING')}>
                    Mark Investigating
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleBulkStatusChange('RESOLVED')}>
                    Mark Resolved
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Table ───────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300 border-collapse" role="grid">
            <thead className="border-b border-white/[0.05] bg-white/[0.02] text-zinc-500 font-mono text-[10px] uppercase tracking-widest sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === sorted.length && sorted.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-700 bg-zinc-900/50 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                    aria-label="Select all incidents"
                  />
                </th>
                <th className="py-3 px-3 w-28">Severity</th>
                <th className="py-3 px-3">Incident</th>
                <th className="py-3 px-3 w-32 hidden md:table-cell">Status</th>
                <th className="py-3 px-3 w-36 hidden lg:table-cell">Assignee</th>
                <th className="py-3 px-3 w-32 hidden lg:table-cell">Reported</th>
                <th className="py-3 px-3 w-10 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading ? (
                // Loading skeleton rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-4"><div className="skeleton h-3.5 w-3.5 rounded" /></td>
                    <td className="py-4 px-3"><div className="skeleton h-5 w-16 rounded-full" /></td>
                    <td className="py-4 px-3">
                      <div className="space-y-1.5">
                        <div className="skeleton h-3.5 w-3/4 rounded" />
                        <div className="skeleton h-3 w-1/2 rounded" />
                      </div>
                    </td>
                    <td className="py-4 px-3 hidden md:table-cell"><div className="skeleton h-5 w-20 rounded-md" /></td>
                    <td className="py-4 px-3 hidden lg:table-cell"><div className="skeleton h-3.5 w-24 rounded" /></td>
                    <td className="py-4 px-3 hidden lg:table-cell"><div className="skeleton h-3 w-20 rounded" /></td>
                    <td className="py-4 px-3" />
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="py-16 text-center">
                      <p className="text-zinc-500 text-sm">
                        {hasActiveFilters
                          ? 'No incidents match your current filters.'
                          : 'No incidents found in this organization.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={() => setFilters({ severity: 'ALL', status: 'ALL', category: 'ALL', search: '' })}
                          className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
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
                    className={cn(
                      'hover:bg-white/[0.025] transition-colors cursor-pointer group relative',
                      selectedIds.includes(inc.id) && 'bg-indigo-950/20'
                    )}
                  >
                    {/* Severity accent bar */}
                    <td className="py-3.5 px-4 relative" onClick={(e) => toggleSelectOne(inc.id, e)}>
                      <div
                        className={cn(
                          'absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full opacity-0 group-hover:opacity-70 transition-opacity',
                          SEVERITY_BAR[inc.severity]
                        )}
                      />
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inc.id)}
                        onChange={() => {}}
                        className="rounded border-zinc-700 bg-zinc-900/50 text-indigo-600 focus:ring-0"
                        aria-label={`Select incident ${inc.id}`}
                      />
                    </td>

                    <td className="py-3.5 px-3">
                      <SeverityBadge severity={inc.severity} size="xs" />
                    </td>

                    <td className="py-3.5 px-3 max-w-md">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-zinc-600">{inc.id}</span>
                          {inc.ai_summary && (
                            <span className="text-[9px] font-mono text-indigo-300/70 border border-indigo-500/20 bg-indigo-500/[0.07] rounded px-1.5 py-0.5 uppercase tracking-wider">
                              AI
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                          {inc.title}
                        </h3>
                        <p className="text-zinc-500 line-clamp-1 font-normal leading-relaxed">
                          {inc.description}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono pt-0.5">
                          <span className="bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.05]">
                            {inc.category}
                          </span>
                          {inc.comments_count ? (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {inc.comments_count}
                            </span>
                          ) : null}
                          {inc.attachments_count ? (
                            <span className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {inc.attachments_count}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 hidden md:table-cell">
                      <StatusBadge status={inc.status} size="xs" />
                    </td>

                    <td className="py-3.5 px-3 hidden lg:table-cell">
                      {inc.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-zinc-800 border border-white/[0.08] flex items-center justify-center text-[9px] font-semibold text-zinc-300 shrink-0">
                            {(inc.assigned_to.full_name || inc.assigned_to.email || '?')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <span className="text-zinc-300 font-medium truncate text-[11px]">
                            {inc.assigned_to.full_name || inc.assigned_to.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-700 font-mono text-[10px] italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 hidden lg:table-cell">
                      <div className="font-mono text-[10px] text-zinc-500">
                        <div>{new Date(inc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                        <div className="text-zinc-700">
                          {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncident(inc);
                          navigate(`/incidents/${inc.id}`);
                        }}
                        className="p-1 rounded-md text-zinc-700 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors opacity-0 group-hover:opacity-100"
                        aria-label={`Open incident ${inc.id}`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
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
