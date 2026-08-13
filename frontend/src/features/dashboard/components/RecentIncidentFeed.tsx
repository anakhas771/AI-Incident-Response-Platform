import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { SeverityBadge, StatusBadge } from '../../../components/ui/Badge';
import { Incident } from '../../../types';

interface RecentIncidentFeedProps {
  incidents: Incident[];
  isLoading?: boolean;
}

export const RecentIncidentFeed: React.FC<RecentIncidentFeedProps> = ({
  incidents,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return null; // Handled by DashboardSkeleton
  }

  const handleIncidentClick = (id: string) => {
    navigate(`/incidents/${id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleIncidentClick(id);
    }
  };

  return (
    <Card hoverEffect={false} className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-subtle">
        <div>
          <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Live Active Incidents Queue
          </CardTitle>
          <CardDescription>Prioritized by severity & response SLA</CardDescription>
        </div>
        <Link
          to="/incidents"
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
          aria-label="View all incidents in queue"
        >
          View All <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>

      <div
        className="divide-y divide-subtle flex-1 overflow-y-auto"
        role="feed"
        aria-label="Recent incidents feed"
      >
        {incidents.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs font-mono">
            No active incidents reported in this queue.
          </div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => handleIncidentClick(inc.id)}
              onKeyDown={(e) => handleKeyDown(e, inc.id)}
              tabIndex={0}
              role="article"
              aria-label={`Incident ${inc.id}: ${inc.title}, Severity ${inc.severity}, Status ${inc.status}`}
              className="p-4 flex items-center justify-between gap-4 hover:bg-surface-elevated/60 focus:bg-surface-elevated/80 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-3 truncate">
                <SeverityBadge severity={inc.severity} />
                <div className="truncate">
                  <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                    {inc.title}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 font-mono">
                    <span>{inc.id}</span>
                    <span>•</span>
                    <span>{inc.category}</span>
                    <span>•</span>
                    <span>
                      Assignee: {inc.assigned_to ? inc.assigned_to.full_name : 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={inc.status} />
                <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default RecentIncidentFeed;
