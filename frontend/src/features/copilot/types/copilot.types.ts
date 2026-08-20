import {
  ChatSession,
  ChatMessage,
  ChatCitation,
  ChatConfidence,
  ChatUsage,
  MessageRole,
  StreamCallbacks,
} from '../../../types/chat';

export type CopilotFilter = 'all' | 'pinned' | 'recent' | 'archived';

export type CopilotModel = 'gpt-4o' | 'gpt-4-turbo' | 'claude-3-5-sonnet' | 'enterprise-rag';

export interface CopilotSession extends ChatSession {
  model?: CopilotModel;
  unread_count?: number;
  last_confidence_score?: number;
}

export interface CopilotMessage extends ChatMessage {
  retryCount?: number;
  editedAt?: string;
  model?: CopilotModel;
}

export type CopilotCitation = ChatCitation;
export type CopilotConfidence = ChatConfidence;
export type CopilotUsage = ChatUsage;
export type CopilotMessageRole = MessageRole;
export type CopilotStreamCallbacks = StreamCallbacks;

export interface CopilotStoreState {
  sessions: CopilotSession[];
  activeSessionId: string | null;
  messages: Record<string, CopilotMessage[]>;
  isStreaming: boolean;
  streamingMessageId: string | null;
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  errorCode: string | null;
  selectedCitation: CopilotCitation | null;
  isCitationDrawerOpen: boolean;
  isSidebarOpen: boolean;
  searchQuery: string;
  filter: CopilotFilter;
  tokenUsage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  confidenceScore: CopilotConfidence | null;
  canRetry: boolean;
  canRegenerate: boolean;
  currentModel: CopilotModel;
  abortController: AbortController | null;

  // Actions
  loadSessions: (isArchived?: boolean) => Promise<void>;
  createSession: (title?: string, isPinned?: boolean) => Promise<CopilotSession>;
  selectSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  archiveSession: (sessionId: string, isArchived?: boolean) => Promise<void>;
  togglePinSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  loadMessages: (sessionId: string, force?: boolean) => Promise<void>;
  sendPrompt: (promptText: string) => Promise<void>;
  stopGeneration: () => void;
  regenerateResponse: () => Promise<void>;
  retryResponse: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: CopilotFilter) => void;
  setSelectedCitation: (citation: CopilotCitation | null) => void;
  toggleSidebar: () => void;
  setCurrentModel: (model: CopilotModel) => void;
  clearError: () => void;
  reset: () => void;
}
