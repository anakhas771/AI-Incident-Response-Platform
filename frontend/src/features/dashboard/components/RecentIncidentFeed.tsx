import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowUpRight, AlertTriangle, Search, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { SeverityBadge, StatusBadge } from '../../../components/ui/Badge';
import { Incident, Severity } from '../../../types';
import { cn } from '../../../utils/cn';

interface RecentIncidentFeedProps {
  incidents: Incident[];
  isLoading?: boolean;
}

const SEVERITY_ORDER: Record<Severity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const RecentIncidentFeed: React.FC<RecentIncidentFeedProps> = ({
  incidents,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');

  if (isLoading) return null;

  const filtered = incidents
    .filter((inc) => {
      if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          inc.title.toLowerCase().includes(q) ||
          inc.id.toLowerCase().includes(q) ||
          inc.category.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const handleClick = (id: string) => navigate(`/incidents/${id}`);
  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(id);
    }
  };

  const SEVERITIES: Array<Severity | 'ALL'> = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const SEVERITY_COLORS: Record<Severity, string> = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#f59e0b',
    LOW: '#10b981',
  };

  return (
    <Card hoverEffect={false} className="flex flex-col bg-surface border-white/[0.06]">
      <CardHeader className="flex flex-row items-start justify-between pb-3 border-b border-white/[0.05] gap-4">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            Live Active Incidents
          </CardTitle>
          <CardDescription className="mt-0.5">
            {incidents.length} active · prioritized by severity
          </CardDescription>
        </div>
        <Link
          to="/incidents"
          className="shrink-0 text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
          aria-label="View all incidents"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>

      {/* Inline filters */}
      {incidents.length > 0 && (
        <div className="px-4 pt-3 pb-2 space-y-2 border-b border-white/[0.04]">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search incidents..."
              className="w-full bg-white/[0.025] border border-white/[0.06] rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.04] transition-colors"
            />
          </div>

          {/* Severity filter pills */}
          <div className="flex items-center gap-1 flex-wrap">
            <Filter className="h-3 w-3 text-zinc-600 shrink-0" />
            {SEVERITIES.map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider transition-all',
                  severityFilter === sev
                    ? 'bg-white/[0.1] text-zinc-200 border border-white/[0.15]'
                    : 'text-zinc-600 hover:text-zinc-400 border border-transparent'
                )}
                aria-pressed={severityFilter === sev}
              >
                {sev === 'ALL' ? 'All' : sev}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="divide-y divide-white/[0.04] flex-1 overflow-y-auto"
        role="feed"
        aria-label="Active incidents"
      >
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs font-mono">
            {incidents.length === 0
              ? 'No active incidents in this queue.'
              : 'No incidents match the current filter.'}
          </div>
        ) : (
          filtered.map((inc) => (
            <div
              key={inc.id}
              onClick={() => handleClick(inc.id)}
              onKeyDown={(e) => handleKeyDown(e, inc.id)}
              tabIndex={0}
              role="article"
              aria-label={`${inc.severity} incident: ${inc.title}, status ${inc.status}`}
              className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.03] focus:bg-white/[0.04] focus:outline-none transition-colors cursor-pointer group"
            >
              {/* Severity bar */}
              <div
                className="w-0.5 self-stretch rounded-full shrink-0 opacity-70"
                style={{
                  backgroundColor: SEVERITY_COLORS[inc.severity],
                }}
              />

              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <SeverityBadge severity={inc.severity} showDot={false} size="xs" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                    {inc.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-600 font-mono">
                    <span className="truncate">{inc.id}</span>
                    <span className="text-zinc-800">·</span>
                    <span>{inc.category}</span>
                    {inc.assigned_to && (
                      <>
                        <span className="text-zinc-800">·</span>
                        <span className="truncate">{inc.assigned_to.full_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* AI analysis indicator */}
                {inc.ai_summary && (
                  <span className="hidden sm:inline text-[9px] font-mono text-indigo-300/70 border border-indigo-500/20 bg-indigo-500/[0.07] rounded px-1.5 py-0.5 uppercase tracking-wider">
                    AI
                  </span>
                )}
                <StatusBadge status={inc.status} />
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default RecentIncidentFeed;
