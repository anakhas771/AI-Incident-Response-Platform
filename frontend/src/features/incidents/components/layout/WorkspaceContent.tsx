import React from 'react';
import { Comment, Incident, User } from '../../../../types';
import {
  IncidentAttachment,
  IncidentAuditLog,
  IncidentRCA,
  IncidentRecommendation,
  IncidentTimelineItem,
  IncidentWorkspaceTab,
  SimilarIncidentCard,
} from '../../types';
import { IncidentSummaryPanel } from '../IncidentSummaryPanel';
import { IncidentTimeline } from '../timeline/IncidentTimeline';
import { RootCauseAnalysisCard } from '../RootCauseAnalysisCard';
import { RecommendationList } from '../recommendations/RecommendationList';
import { SimilarIncidentsCard } from '../SimilarIncidentsCard';
import { CommentsPanel } from '../CommentsPanel';
import { AttachmentsPanel } from '../AttachmentsPanel';
import { AuditTrailPanel } from '../AuditTrailPanel';
import { AISummaryCard } from '../../../../components/ai/AISummaryCard';

export interface WorkspaceContentProps {
  selectedTab: IncidentWorkspaceTab;
  incident: Incident | null;
  timeline: IncidentTimelineItem[];
  rootCause: IncidentRCA | null;
  recommendations: IncidentRecommendation[];
  similarIncidents: SimilarIncidentCard[];
  comments: Comment[];
  attachments: IncidentAttachment[];
  auditTrail: IncidentAuditLog[];
  currentUser: User | null;
  onPostComment: (message: string, author: User) => Promise<void>;
  onUploadAttachment: (file: File, user: User) => Promise<void>;
  isLoadingIncident?: boolean;
  incidentError?: string | null;
  aiStatus?: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  onRetryAnalysis?: () => void;
}

export const WorkspaceContent: React.FC<WorkspaceContentProps> = React.memo(
  ({
    selectedTab,
    incident,
    timeline,
    rootCause,
    recommendations,
    similarIncidents,
    comments,
    attachments,
    auditTrail,
    currentUser,
    onPostComment,
    onUploadAttachment,
    isLoadingIncident,
    incidentError,
    aiStatus,
    onRetryAnalysis,
  }) => {
    if (incidentError) {
      return (
        <div className="py-12 text-center space-y-3 bg-surface border border-rose-900/30 rounded-xl">
          <div className="text-rose-400 font-medium">{incidentError}</div>
          <p className="text-xs text-zinc-400">
            Please try refreshing the page or checking your connection.
          </p>
        </div>
      );
    }

    if (!incident || isLoadingIncident) {
      return (
        <div className="py-12 text-center space-y-3 bg-surface border border-subtle rounded-xl">
          <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse mx-auto" />
          <p className="text-xs text-zinc-400 font-mono">Loading incident command center...</p>
        </div>
      );
    }

    return (
      <div role="tabpanel" id={`tabpanel-${selectedTab}`} className="space-y-6">
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            <IncidentSummaryPanel
              incident={incident}
              isLoading={isLoadingIncident}
              error={incidentError}
            />

            {incident.ai_summary && (
              <AISummaryCard summary={incident.ai_summary} incidentTitle={incident.title} />
            )}

            <RootCauseAnalysisCard rca={rootCause} aiStatus={aiStatus} onRetry={onRetryAnalysis} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecommendationList
                recommendations={recommendations.slice(0, 2)}
                aiStatus={aiStatus}
                onRetry={onRetryAnalysis}
              />
              <CommentsPanel
                comments={comments}
                currentUser={currentUser}
                onPostComment={onPostComment}
              />
            </div>
          </div>
        )}

        {selectedTab === 'timeline' && <IncidentTimeline timeline={timeline} />}

        {selectedTab === 'rca' && (
          <RootCauseAnalysisCard rca={rootCause} aiStatus={aiStatus} onRetry={onRetryAnalysis} />
        )}

        {selectedTab === 'recommendations' && (
          <RecommendationList
            recommendations={recommendations}
            aiStatus={aiStatus}
            onRetry={onRetryAnalysis}
          />
        )}

        {selectedTab === 'similar' && (
          <SimilarIncidentsCard
            similarIncidents={similarIncidents}
            aiStatus={aiStatus}
            onRetry={onRetryAnalysis}
          />
        )}

        {selectedTab === 'comments' && (
          <CommentsPanel
            comments={comments}
            currentUser={currentUser}
            onPostComment={onPostComment}
          />
        )}

        {selectedTab === 'attachments' && (
          <AttachmentsPanel
            attachments={attachments}
            currentUser={currentUser}
            onUploadAttachment={onUploadAttachment}
          />
        )}

        {selectedTab === 'audit' && <AuditTrailPanel auditTrail={auditTrail} />}
      </div>
    );
  }
);

WorkspaceContent.displayName = 'WorkspaceContent';
