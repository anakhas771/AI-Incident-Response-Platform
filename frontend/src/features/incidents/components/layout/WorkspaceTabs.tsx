import React from 'react';
import { IncidentWorkspaceTab } from '../../types';
import {
  Brain,
  FileText,
  History,
  Layers,
  Lightbulb,
  MessageSquare,
  Paperclip,
  Shield,
} from 'lucide-react';

export interface WorkspaceTabsProps {
  selectedTab: IncidentWorkspaceTab;
  onSelectTab: (tab: IncidentWorkspaceTab) => void;
  timelineCount?: number;
  recommendationsCount?: number;
  similarCount?: number;
  commentsCount?: number;
  attachmentsCount?: number;
  auditCount?: number;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = React.memo(
  ({
    selectedTab,
    onSelectTab,
    timelineCount = 0,
    recommendationsCount = 0,
    similarCount = 0,
    commentsCount = 0,
    attachmentsCount = 0,
    auditCount = 0,
  }) => {
    const tabs: Array<{
      id: IncidentWorkspaceTab;
      label: string;
      icon: React.ReactNode;
      count?: number;
    }> = [
      { id: 'overview', label: 'Overview', icon: <FileText className="h-3.5 w-3.5" /> },
      {
        id: 'timeline',
        label: 'Timeline',
        icon: <History className="h-3.5 w-3.5" />,
        count: timelineCount,
      },
      { id: 'rca', label: 'AI RCA', icon: <Brain className="h-3.5 w-3.5 text-cyan-400" /> },
      {
        id: 'recommendations',
        label: 'Remediation',
        icon: <Lightbulb className="h-3.5 w-3.5 text-amber-400" />,
        count: recommendationsCount,
      },
      {
        id: 'similar',
        label: 'Correlated',
        icon: <Layers className="h-3.5 w-3.5 text-purple-400" />,
        count: similarCount,
      },
      {
        id: 'comments',
        label: 'Discussions',
        icon: <MessageSquare className="h-3.5 w-3.5" />,
        count: commentsCount,
      },
      {
        id: 'attachments',
        label: 'Evidence',
        icon: <Paperclip className="h-3.5 w-3.5" />,
        count: attachmentsCount,
      },
      { id: 'audit', label: 'Audit', icon: <Shield className="h-3.5 w-3.5" />, count: auditCount },
    ];

    return (
      <div
        className="-mx-1 overflow-x-auto px-1 pb-1 scrollbar-none"
        role="tablist"
        aria-label="Incident Command Center View Navigation"
      >
        <div className="flex min-w-max gap-1 border-b border-subtle pt-1">
          {tabs.map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-2.5 py-2.5 text-[11px] font-semibold transition-all sm:px-3 sm:text-xs ${
                  isActive
                    ? 'border-indigo-500 bg-surface-elevated/40 text-zinc-100'
                    : 'border-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`rounded-full border px-1.5 py-0.5 text-[9px] font-mono ${isActive ? 'border-indigo-800 bg-indigo-950 text-indigo-300' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

WorkspaceTabs.displayName = 'WorkspaceTabs';
