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
      { id: 'overview', label: 'Overview', icon: <FileText className="w-3.5 h-3.5" /> },
      {
        id: 'timeline',
        label: 'Timeline Feed',
        icon: <History className="w-3.5 h-3.5" />,
        count: timelineCount,
      },
      { id: 'rca', label: 'AI RCA', icon: <Brain className="w-3.5 h-3.5 text-cyan-400" /> },
      {
        id: 'recommendations',
        label: 'Remediation',
        icon: <Lightbulb className="w-3.5 h-3.5 text-amber-400" />,
        count: recommendationsCount,
      },
      {
        id: 'similar',
        label: 'Correlated',
        icon: <Layers className="w-3.5 h-3.5 text-purple-400" />,
        count: similarCount,
      },
      {
        id: 'comments',
        label: 'Discussions',
        icon: <MessageSquare className="w-3.5 h-3.5" />,
        count: commentsCount,
      },
      {
        id: 'attachments',
        label: 'Evidence',
        icon: <Paperclip className="w-3.5 h-3.5" />,
        count: attachmentsCount,
      },
      {
        id: 'audit',
        label: 'Audit Trail',
        icon: <Shield className="w-3.5 h-3.5" />,
        count: auditCount,
      },
    ];

    return (
      <div
        role="tablist"
        aria-label="Incident Command Center View Navigation"
        className="flex border-b border-subtle overflow-x-auto scrollbar-none gap-1 pt-1"
      >
        {tabs.map((tab) => {
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 rounded-t-lg ${
                isActive
                  ? 'border-indigo-500 text-zinc-100 bg-surface-elevated/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }
);

WorkspaceTabs.displayName = 'WorkspaceTabs';
