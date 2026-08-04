import { create } from 'zustand';
import {
  CopilotStoreState,
  CopilotMessage,
  CopilotCitation,
  CopilotFilter,
  CopilotModel,
} from '../types';
import { copilotService } from '../services';

const INITIAL_TOKEN_USAGE = {
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
};

export const useCopilotStore = create<CopilotStoreState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: {},
  isStreaming: false,
  streamingMessageId: null,
  isLoadingSessions: false,
  isLoadingMessages: false,
  error: null,
  errorCode: null,
  selectedCitation: null,
  isCitationDrawerOpen: false,
  isSidebarOpen: true,
  searchQuery: '',
  filter: 'all',
  tokenUsage: { ...INITIAL_TOKEN_USAGE },
  confidenceScore: null,
  canRetry: false,
  canRegenerate: false,
  currentModel: 'gpt-4o',
  abortController: null,

  loadSessions: async (isArchived = false) => {
    set({ isLoadingSessions: true, error: null, errorCode: null });
    try {
      const sessions = await copilotService.listSessions(isArchived);
      set((state) => {
        const currentActive = state.activeSessionId;
        const fallbackActive = sessions.length > 0 ? sessions[0].id : null;
        const newActiveId =
          currentActive && sessions.some((s) => s.id === currentActive)
            ? currentActive
            : fallbackActive;

        return {
          sessions,
          isLoadingSessions: false,
          activeSessionId: newActiveId,
        };
      });

      const activeId = get().activeSessionId;
      if (activeId) {
        await get().loadMessages(activeId);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load enterprise copilot sessions';
      set({ error: message, isLoadingSessions: false });
    }
  },

  createSession: async (title = 'New Investigation', isPinned = false) => {
    set({ error: null, errorCode: null });
    try {
      const newSession = await copilotService.createSession(title, isPinned);
      set((state) => ({
        sessions: [newSession, ...state.sessions],
        activeSessionId: newSession.id,
        messages: { ...state.messages, [newSession.id]: [] },
        error: null,
        canRetry: false,
        canRegenerate: false,
      }));
      return newSession;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create copilot session';
      set({ error: message, errorCode: 'CREATE_SESSION_ERROR' });
      throw err;
    }
  },

  selectSession: async (sessionId: string) => {
    set({
      activeSessionId: sessionId,
      error: null,
      errorCode: null,
      selectedCitation: null,
      isCitationDrawerOpen: false,
    });
    await get().loadMessages(sessionId);
  },

  renameSession: async (sessionId: string, title: string) => {
    try {
      await copilotService.renameSession(sessionId, title);
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, title, updated_at: new Date().toISOString() } : s
        ),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rename session';
      set({ error: message });
    }
  },

  archiveSession: async (sessionId: string, isArchived = true) => {
    try {
      await copilotService.archiveSession(sessionId, isArchived);
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? { ...s, is_archived: isArchived, updated_at: new Date().toISOString() }
            : s
        ),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive session';
      set({ error: message });
    }
  },

  togglePinSession: async (sessionId: string) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const nextPinned = !session.is_pinned;
    try {
      await copilotService.togglePinSession(sessionId, nextPinned);
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? { ...s, is_pinned: nextPinned, updated_at: new Date().toISOString() }
            : s
        ),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pin session';
      set({ error: message });
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      await copilotService.deleteSession(sessionId);
      set((state) => {
        const remaining = state.sessions.filter((s) => s.id !== sessionId);
        const nextActiveId =
          state.activeSessionId === sessionId
            ? remaining.length > 0
              ? remaining[0].id
              : null
            : state.activeSessionId;
        const newMessages = { ...state.messages };
        delete newMessages[sessionId];
        return {
          sessions: remaining,
          activeSessionId: nextActiveId,
          messages: newMessages,
        };
      });

      const nextId = get().activeSessionId;
      if (nextId) {
        await get().loadMessages(nextId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete session';
      set({ error: message });
    }
  },

  loadMessages: async (sessionId: string, force = false) => {
    if (!force && get().messages[sessionId]?.length > 0) {
      // Check if we can enable regenerate for last assistant message
      const msgs = get().messages[sessionId] || [];
      const lastMsg = msgs[msgs.length - 1];
      set({
        canRegenerate: lastMsg?.role === 'assistant' && !get().isStreaming,
        canRetry: Boolean(lastMsg?.error),
      });
      return;
    }

    set({ isLoadingMessages: true, error: null });
    try {
      const msgs = await copilotService.loadMessages(sessionId);
      set((state) => ({
        messages: { ...state.messages, [sessionId]: msgs },
        isLoadingMessages: false,
        canRegenerate: msgs.length > 0 && msgs[msgs.length - 1]?.role === 'assistant',
        canRetry: msgs.length > 0 && Boolean(msgs[msgs.length - 1]?.error),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load messages';
      set({ error: message, isLoadingMessages: false });
    }
  },

  sendPrompt: async (promptText: string) => {
    const activeId = get().activeSessionId;
    if (!activeId) {
      set({ error: 'No active session selected', errorCode: 'NO_ACTIVE_SESSION' });
      return;
    }

    if (get().isStreaming) {
      return;
    }

    const controller = new AbortController();
    const userMsgId = `msg-user-${Date.now()}`;
    const asstMsgId = `msg-asst-${Date.now() + 1}`;

    const userMessage: CopilotMessage = {
      id: userMsgId,
      session_id: activeId,
      role: 'user',
      content: promptText,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    const asstMessage: CopilotMessage = {
      id: asstMsgId,
      session_id: activeId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true,
      citations: [],
      model: get().currentModel,
    };

    // Optimistically add user and placeholder assistant messages
    set((state) => {
      const currentMsgs = state.messages[activeId] || [];
      return {
        messages: {
          ...state.messages,
          [activeId]: [...currentMsgs, userMessage, asstMessage],
        },
        isStreaming: true,
        streamingMessageId: asstMsgId,
        abortController: controller,
        error: null,
        errorCode: null,
        canRetry: false,
        canRegenerate: false,
        confidenceScore: null,
      };
    });

    try {
      await copilotService.streamResponse(
        activeId,
        promptText,
        {
          onStart: () => {
            set((state) => {
              const msgs = state.messages[activeId] || [];
              return {
                messages: {
                  ...state.messages,
                  [activeId]: msgs.map((m) =>
                    m.id === asstMsgId ? { ...m, isStreaming: true } : m
                  ),
                },
              };
            });
          },
          onToken: (token) => {
            set((state) => {
              const msgs = state.messages[activeId] || [];
              return {
                messages: {
                  ...state.messages,
                  [activeId]: msgs.map((m) =>
                    m.id === asstMsgId ? { ...m, content: m.content + token } : m
                  ),
                },
              };
            });
          },
          onCitation: (citations) => {
            set((state) => {
              const msgs = state.messages[activeId] || [];
              return {
                messages: {
                  ...state.messages,
                  [activeId]: msgs.map((m) =>
                    m.id === asstMsgId
                      ? { ...m, citations: [...(m.citations || []), ...citations] }
                      : m
                  ),
                },
              };
            });
          },
          onConfidence: (confidence) => {
            set((state) => {
              const msgs = state.messages[activeId] || [];
              return {
                confidenceScore: confidence,
                messages: {
                  ...state.messages,
                  [activeId]: msgs.map((m) => (m.id === asstMsgId ? { ...m, confidence } : m)),
                },
              };
            });
          },
          onSuggestedQuestions: (questions) => {
            set((state) => {
              const msgs = state.messages[activeId] || [];
              return {
                messages: {
                  ...state.messages,
                  [activeId]: msgs.map((m) =>
                    m.id === asstMsgId ? { ...m, suggested_questions: questions } : m
                  ),
                },
              };
            });
          },
          onUsage: (usage) => {
            set((state) => {
              const msgs = state.messages[activeId] || [];
              return {
                tokenUsage: {
                  prompt_tokens: usage.prompt_tokens || 0,
                  completion_tokens: usage.completion_tokens || 0,
                  total_tokens: usage.total_tokens || 0,
                },
                messages: {
                  ...state.messages,
                  [activeId]: msgs.map((m) => (m.id === asstMsgId ? { ...m, usage } : m)),
                },
              };
            });
          },
          onDone: () => {
            set((state) => {
              const msgs = state.messages[activeId] || [];
              return {
                isStreaming: false,
                streamingMessageId: null,
                abortController: null,
                canRegenerate: true,
                canRetry: false,
                messages: {
                  ...state.messages,
                  [activeId]: msgs.map((m) =>
                    m.id === asstMsgId ? { ...m, isStreaming: false, isOptimistic: false } : m
                  ),
                },
              };
            });
          },
          onError: (err) => {
            set((state) => {
              const msgs = state.messages[activeId] || [];
              return {
                isStreaming: false,
                streamingMessageId: null,
                abortController: null,
                error: err.error,
                errorCode: err.code || 'STREAM_ERROR',
                canRetry: true,
                canRegenerate: false,
                messages: {
                  ...state.messages,
                  [activeId]: msgs.map((m) =>
                    m.id === asstMsgId ? { ...m, isStreaming: false, error: err.error } : m
                  ),
                },
              };
            });
          },
        },
        controller.signal
      );
    } catch (err) {
      if (controller.signal.aborted) {
        set((state) => {
          const msgs = state.messages[activeId] || [];
          return {
            isStreaming: false,
            streamingMessageId: null,
            abortController: null,
            messages: {
              ...state.messages,
              [activeId]: msgs.map((m) =>
                m.id === asstMsgId
                  ? {
                      ...m,
                      isStreaming: false,
                      content: m.content + '\n\n*(Generation stopped by user)*',
                    }
                  : m
              ),
            },
          };
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'Stream failed';
      set((state) => {
        const msgs = state.messages[activeId] || [];
        return {
          isStreaming: false,
          streamingMessageId: null,
          abortController: null,
          error: message,
          errorCode: 'UNHANDLED_STREAM_ERROR',
          canRetry: true,
          messages: {
            ...state.messages,
            [activeId]: msgs.map((m) =>
              m.id === asstMsgId ? { ...m, isStreaming: false, error: message } : m
            ),
          },
        };
      });
    }
  },

  stopGeneration: () => {
    const controller = get().abortController;
    if (controller) {
      controller.abort();
    }
    const activeId = get().activeSessionId;
    const streamingId = get().streamingMessageId;
    set((state) => {
      const msgs = activeId ? state.messages[activeId] || [] : [];
      return {
        isStreaming: false,
        streamingMessageId: null,
        abortController: null,
        canRegenerate: true,
        messages: activeId
          ? {
              ...state.messages,
              [activeId]: msgs.map((m) =>
                m.id === streamingId ? { ...m, isStreaming: false } : m
              ),
            }
          : state.messages,
      };
    });
  },

  regenerateResponse: async () => {
    const activeId = get().activeSessionId;
    if (!activeId || get().isStreaming) return;
    const msgs = get().messages[activeId] || [];
    // Find the last user message
    const lastUserMsg = [...msgs].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    // Remove the last assistant message if present
    set((state) => {
      const updatedMsgs = state.messages[activeId] || [];
      const trimmed = updatedMsgs.filter((m, index) => {
        if (index === updatedMsgs.length - 1 && m.role === 'assistant') {
          return false;
        }
        return true;
      });
      return {
        messages: { ...state.messages, [activeId]: trimmed },
        error: null,
        errorCode: null,
      };
    });

    // Re-trigger send prompt with last user prompt
    await get().sendPrompt(lastUserMsg.content);
  },

  retryResponse: async () => {
    const activeId = get().activeSessionId;
    if (!activeId || get().isStreaming) return;
    const msgs = get().messages[activeId] || [];
    const lastUserMsg = [...msgs].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;
    await get().regenerateResponse();
  },

  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  setFilter: (filter: CopilotFilter) => set({ filter }),
  setSelectedCitation: (citation: CopilotCitation | null) =>
    set({ selectedCitation: citation, isCitationDrawerOpen: Boolean(citation) }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setCurrentModel: (currentModel: CopilotModel) => set({ currentModel }),
  clearError: () => set({ error: null, errorCode: null }),
  reset: () =>
    set({
      sessions: [],
      activeSessionId: null,
      messages: {},
      isStreaming: false,
      streamingMessageId: null,
      error: null,
      errorCode: null,
      selectedCitation: null,
      isCitationDrawerOpen: false,
      tokenUsage: { ...INITIAL_TOKEN_USAGE },
      confidenceScore: null,
      canRetry: false,
      canRegenerate: false,
    }),
}));

export default useCopilotStore;
