import React, { useEffect, useCallback } from 'react';
import { useCopilotChat } from '../../../copilot/hooks/useCopilotChat';
import { CopilotChatWindow } from '../../../copilot/components';
import { Incident } from '../../../../types';
import { ChatErrorBoundary } from '../../../../components/ui/ChatErrorBoundary';
import { X } from 'lucide-react';
import { useIncidentAIStore } from '../../state';

export interface IncidentCopilotPanelProps {
  incident: Incident | null;
  onClose: () => void;
}

export const IncidentCopilotPanel: React.FC<IncidentCopilotPanelProps> = ({
  incident,
  onClose,
}) => {
  const {
    activeSession,
    messages,
    isStreaming,
    isLoadingMessages,
    error,
    currentModel,
    tokenUsage,
    confidenceScore,
    createSession,
    selectSession,
    sendPrompt,
    stopGeneration,
    regenerateResponse,
    retryResponse,
    setCurrentModel,
    clearError,
    sessions,
  } = useCopilotChat();

  const { rootCause, recommendations, summary } = useIncidentAIStore();

  // On mount or incident change, ensure a session exists for this incident
  useEffect(() => {
    if (!incident) return;

    // Find if we already have a session for this incident
    const sessionName = `Investigation: ${incident.title}`;
    const existingSession = sessions.find((s) => s.title === sessionName);

    if (existingSession) {
      if (activeSession?.id !== existingSession.id) {
        selectSession(existingSession.id);
      }
    } else {
      createSession(sessionName);
    }
  }, [incident, sessions, activeSession, selectSession, createSession]);

  const handleSendMessageWithContext = useCallback(
    async (text: string) => {
      if (!incident) return;

      const aiSummary = summary || '';
      const rcaText = rootCause ? rootCause.ai_explanation : '';
      const recsText = recommendations.map((r) => r.title).join(', ');

      const context = `[INCIDENT CONTEXT: ${incident.id} - ${incident.title}
Severity: ${incident.severity}
Status: ${incident.status}
Category: ${incident.category}
AI Summary: ${aiSummary}
RCA: ${rcaText}
Recommendations: ${recsText}]

`;
      await sendPrompt(context + text);
    },
    [incident, summary, rootCause, recommendations, sendPrompt]
  );

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          Enterprise Copilot
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="Close Copilot"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <ChatErrorBoundary>
          <CopilotChatWindow
            session={activeSession}
            messages={messages}
            isStreaming={isStreaming}
            isLoadingMessages={isLoadingMessages}
            error={error}
            currentModel={currentModel}
            tokenUsage={tokenUsage}
            confidenceScore={confidenceScore}
            onSendPrompt={handleSendMessageWithContext}
            onStopGeneration={stopGeneration}
            onRegenerate={regenerateResponse}
            onRetry={retryResponse}
            onSelectModel={setCurrentModel}
            onOpenShortcuts={() => {}}
            onNewSession={() => {
              if (incident) createSession(`Investigation: ${incident.title}`);
            }}
            onOpenSearch={() => {}}
            onClearError={clearError}
            onOpenDocumentPanel={() => {}}
          />
        </ChatErrorBoundary>
      </div>
    </div>
  );
};
