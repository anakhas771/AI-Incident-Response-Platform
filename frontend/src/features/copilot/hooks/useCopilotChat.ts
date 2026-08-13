import { useMemo, useCallback } from 'react';
import { useCopilotStore } from '../state';
import { CopilotSession, CopilotMessage, CopilotFilter, CopilotModel } from '../types';

export interface UseCopilotChatReturn {
  sessions: CopilotSession[];
  filteredSessions: CopilotSession[];
  activeSession: CopilotSession | null;
  activeSessionId: string | null;
  messages: CopilotMessage[];
  isStreaming: boolean;
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  searchQuery: string;
  filter: CopilotFilter;
  tokenUsage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  confidenceScore: { score: number; level?: string } | null;
  canRetry: boolean;
  canRegenerate: boolean;
  currentModel: CopilotModel;
  isSidebarOpen: boolean;

  // Actions
  loadSessions: (isArchived?: boolean) => Promise<void>;
  createSession: (title?: string, isPinned?: boolean) => Promise<CopilotSession>;
  selectSession: (id: string) => Promise<void>;
  renameSession: (id: string, title: string) => Promise<void>;
  archiveSession: (id: string, isArchived?: boolean) => Promise<void>;
  togglePinSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  sendPrompt: (text: string) => Promise<void>;
  stopGeneration: () => void;
  regenerateResponse: () => Promise<void>;
  retryResponse: () => Promise<void>;
  setSearchQuery: (q: string) => void;
  setFilter: (f: CopilotFilter) => void;
  toggleSidebar: () => void;
  setCurrentModel: (m: CopilotModel) => void;
  clearError: () => void;
  handleSuggestedQuestion: (question: string) => Promise<void>;
}

/**
 * Enterprise hook orchestrating Copilot chat state, filtering, and interaction methods.
 */
export function useCopilotChat(): UseCopilotChatReturn {
  const store = useCopilotStore();

  const filteredSessions = useMemo(() => {
    return store.sessions.filter((s) => {
      if (store.filter === 'pinned' && !s.is_pinned) return false;
      if (store.filter === 'archived' && !s.is_archived) return false;
      if (store.filter !== 'archived' && s.is_archived) return false;
      if (store.searchQuery.trim()) {
        const query = store.searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(query) ||
          (s.last_message_preview && s.last_message_preview.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [store.sessions, store.filter, store.searchQuery]);

  const activeSession = useMemo(() => {
    return store.sessions.find((s) => s.id === store.activeSessionId) || null;
  }, [store.sessions, store.activeSessionId]);

  const messages = useMemo(() => {
    if (!store.activeSessionId) return [];
    return store.messages[store.activeSessionId] || [];
  }, [store.messages, store.activeSessionId]);

  const handleSuggestedQuestion = useCallback(
    async (question: string) => {
      await store.sendPrompt(question);
    },
    [store]
  );

  return {
    sessions: store.sessions,
    filteredSessions,
    activeSession,
    activeSessionId: store.activeSessionId,
    messages,
    isStreaming: store.isStreaming,
    isLoadingSessions: store.isLoadingSessions,
    isLoadingMessages: store.isLoadingMessages,
    error: store.error,
    searchQuery: store.searchQuery,
    filter: store.filter,
    tokenUsage: store.tokenUsage,
    confidenceScore: store.confidenceScore,
    canRetry: store.canRetry,
    canRegenerate: store.canRegenerate,
    currentModel: store.currentModel,
    isSidebarOpen: store.isSidebarOpen,
    loadSessions: store.loadSessions,
    createSession: store.createSession,
    selectSession: store.selectSession,
    renameSession: store.renameSession,
    archiveSession: store.archiveSession,
    togglePinSession: store.togglePinSession,
    deleteSession: store.deleteSession,
    sendPrompt: store.sendPrompt,
    stopGeneration: store.stopGeneration,
    regenerateResponse: store.regenerateResponse,
    retryResponse: store.retryResponse,
    setSearchQuery: store.setSearchQuery,
    setFilter: store.setFilter,
    toggleSidebar: store.toggleSidebar,
    setCurrentModel: store.setCurrentModel,
    clearError: store.clearError,
    handleSuggestedQuestion,
  };
}
