import { create } from 'zustand';
import { ChatSession, ChatMessage, ChatCitation, ChatConfidence, ChatUsage } from '../types/chat';
import { copilotApi, streamCopilotChat } from '../api/copilotApi';

export type ChatFilter = 'all' | 'pinned' | 'recent';

export interface ChatStoreState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: Record<string, ChatMessage[]>;
  isStreaming: boolean;
  streamingMessageId: string | null;
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  searchQuery: string;
  filter: ChatFilter;
  abortController: AbortController | null;

  // Actions
  loadSessions: (isArchived?: boolean) => Promise<void>;
  createSession: (title?: string) => Promise<ChatSession>;
  selectSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  togglePinSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  loadMessages: (sessionId: string, force?: boolean) => Promise<void>;
  sendMessage: (messageText: string) => Promise<void>;
  stopGeneration: () => void;
  regenerateMessage: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: ChatFilter) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: {},
  isStreaming: false,
  streamingMessageId: null,
  isLoadingSessions: false,
  isLoadingMessages: false,
  error: null,
  searchQuery: '',
  filter: 'all',
  abortController: null,

  loadSessions: async (isArchived = false) => {
    set({ isLoadingSessions: true, error: null });
    try {
      const sessions = await copilotApi.getSessions(isArchived);
      set({
        sessions,
        isLoadingSessions: false,
        activeSessionId: get().activeSessionId || (sessions.length > 0 ? sessions[0].id : null),
      });
      const activeId = get().activeSessionId;
      if (activeId) {
        get().loadMessages(activeId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load conversation sessions';
      set({ error: message, isLoadingSessions: false });
    }
  },

  createSession: async (title = 'New AI Conversation') => {
    set({ error: null });
    try {
      const newSession = await copilotApi.createSession({ title });
      set((state) => ({
        sessions: [newSession, ...state.sessions],
        activeSessionId: newSession.id,
        messages: { ...state.messages, [newSession.id]: [] },
      }));
      return newSession;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create chat session';
      set({ error: message });
      throw err;
    }
  },

  selectSession: async (sessionId: string) => {
    set({ activeSessionId: sessionId, error: null });
    await get().loadMessages(sessionId);
  },

  renameSession: async (sessionId: string, title: string) => {
    try {
      const updated = await copilotApi.updateSession(sessionId, { title });
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, title: updated.title } : s
        ),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rename session';
      set({ error: message });
    }
  },

  togglePinSession: async (sessionId: string) => {
    const target = get().sessions.find((s) => s.id === sessionId);
    if (!target) return;
    const nextPin = !target.is_pinned;
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, is_pinned: nextPin } : s)),
    }));
    try {
      await copilotApi.updateSession(sessionId, { is_pinned: nextPin });
    } catch (err) {
      // Revert on failure
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, is_pinned: target.is_pinned } : s
        ),
      }));
      const message = err instanceof Error ? err.message : 'Failed to pin session';
      set({ error: message });
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      await copilotApi.deleteSession(sessionId);
      set((state) => {
        const nextSessions = state.sessions.filter((s) => s.id !== sessionId);
        const nextActiveId =
          state.activeSessionId === sessionId
            ? nextSessions.length > 0
              ? nextSessions[0].id
              : null
            : state.activeSessionId;
        const nextMessages = { ...state.messages };
        delete nextMessages[sessionId];
        return {
          sessions: nextSessions,
          activeSessionId: nextActiveId,
          messages: nextMessages,
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete session';
      set({ error: message });
    }
  },

  loadMessages: async (sessionId: string, force = false) => {
    if (!force && get().messages[sessionId]) {
      return; // Already loaded
    }
    set({ isLoadingMessages: true, error: null });
    try {
      const history = await copilotApi.getMessages(sessionId);
      set((state) => ({
        messages: { ...state.messages, [sessionId]: history },
        isLoadingMessages: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load chat history';
      set({ error: message, isLoadingMessages: false });
    }
  },

  sendMessage: async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    // Prevent duplicate streams / race conditions
    if (get().isStreaming) {
      return;
    }

    let sessionId = get().activeSessionId;
    if (!sessionId) {
      const created = await get().createSession(
        trimmed.length > 40 ? trimmed.substring(0, 40) + '...' : trimmed
      );
      sessionId = created.id;
    }

    const currentSessionId = sessionId;
    const userMsgId = 'user-' + Date.now();
    const aiMsgId = 'ai-' + Date.now();

    const userMsg: ChatMessage = {
      id: userMsgId,
      session_id: currentSessionId,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    const initialAiMsg: ChatMessage = {
      id: aiMsgId,
      session_id: currentSessionId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    set((state) => {
      const existing = state.messages[currentSessionId] || [];
      return {
        messages: {
          ...state.messages,
          [currentSessionId]: [...existing, userMsg, initialAiMsg],
        },
        isStreaming: true,
        streamingMessageId: aiMsgId,
        error: null,
      };
    });

    const controller = new AbortController();
    set({ abortController: controller });

    const updateAiMessage = (updater: (msg: ChatMessage) => ChatMessage) => {
      set((state) => {
        const sessionMessages = state.messages[currentSessionId] || [];
        const nextMessages = sessionMessages.map((m) => (m.id === aiMsgId ? updater(m) : m));
        return {
          messages: { ...state.messages, [currentSessionId]: nextMessages },
        };
      });
    };

    try {
      await streamCopilotChat(
        currentSessionId,
        trimmed,
        {
          onToken: (token) => {
            updateAiMessage((m) => ({ ...m, content: m.content + token }));
          },
          onCitation: (citations: ChatCitation[]) => {
            updateAiMessage((m) => ({ ...m, citations }));
          },
          onConfidence: (confidence: ChatConfidence) => {
            updateAiMessage((m) => ({ ...m, confidence }));
          },
          onSuggestedQuestions: (questions: string[]) => {
            updateAiMessage((m) => ({ ...m, suggested_questions: questions }));
          },
          onUsage: (usage: ChatUsage) => {
            updateAiMessage((m) => ({ ...m, usage }));
            set((state) => ({
              sessions: state.sessions.map((s) =>
                s.id === currentSessionId
                  ? {
                      ...s,
                      token_count: (s.token_count || 0) + usage.total_tokens,
                      last_message_preview: (
                        state.messages[currentSessionId]?.find((m) => m.id === aiMsgId)?.content ||
                        ''
                      ).substring(0, 120),
                      last_message_at: new Date().toISOString(),
                    }
                  : s
              ),
            }));
          },
          onDone: () => {
            updateAiMessage((m) => ({ ...m, isStreaming: false }));
            set({ isStreaming: false, streamingMessageId: null, abortController: null });
          },
          onError: (errObj) => {
            updateAiMessage((m) => ({
              ...m,
              isStreaming: false,
              error: errObj.error || 'Stream error occurred',
            }));
            set({ isStreaming: false, streamingMessageId: null, abortController: null });
          },
        },
        controller.signal
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unexpected stream failure';
      updateAiMessage((m) => ({
        ...m,
        isStreaming: false,
        error: errorMsg,
      }));
      set({ isStreaming: false, streamingMessageId: null, abortController: null });
    }
  },

  stopGeneration: () => {
    const controller = get().abortController;
    if (controller) {
      controller.abort();
    }
    const aiId = get().streamingMessageId;
    const currentSessionId = get().activeSessionId;
    if (aiId && currentSessionId) {
      set((state) => {
        const sessionMessages = state.messages[currentSessionId] || [];
        const nextMessages = sessionMessages.map((m) =>
          m.id === aiId
            ? {
                ...m,
                isStreaming: false,
                content: m.content || '*[Generation stopped by user]*',
              }
            : m
        );
        return {
          messages: { ...state.messages, [currentSessionId]: nextMessages },
          isStreaming: false,
          streamingMessageId: null,
          abortController: null,
        };
      });
    } else {
      set({ isStreaming: false, streamingMessageId: null, abortController: null });
    }
  },

  regenerateMessage: async () => {
    if (get().isStreaming) return;
    const sessionId = get().activeSessionId;
    if (!sessionId) return;

    const sessionMessages = get().messages[sessionId] || [];
    // Find last user message
    const lastUserMsg = [...sessionMessages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    // Remove the trailing assistant message if it exists
    set((state) => {
      const current = state.messages[sessionId] || [];
      const trimmed = current.filter((m) => m.id !== lastUserMsg.id && m.role !== 'assistant');
      return {
        messages: {
          ...state.messages,
          [sessionId]: trimmed,
        },
      };
    });

    await get().sendMessage(lastUserMsg.content);
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilter: (filter) => set({ filter }),
  clearError: () => set({ error: null }),
}));
