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

  // ---------------------------------------------------------------------------
  // Sessions
  // ---------------------------------------------------------------------------

  loadSessions: async (isArchived = false) => {
    set({
      isLoadingSessions: true,
      error: null,
      errorCode: null,
    });

    try {
      const sessions = await copilotService.listSessions(isArchived);

      set((state) => {
        const currentActive = state.activeSessionId;

        const fallbackActive = sessions.length > 0 ? sessions[0].id : null;

        const newActiveId =
          currentActive && sessions.some((session) => session.id === currentActive)
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

      set({
        error: message,
        errorCode: 'LOAD_SESSIONS_ERROR',
        isLoadingSessions: false,
      });
    }
  },

  createSession: async (title = 'New Investigation', isPinned = false) => {
    set({
      error: null,
      errorCode: null,
    });

    try {
      const newSession = await copilotService.createSession(title, isPinned);

      set((state) => ({
        sessions: [newSession, ...state.sessions],
        activeSessionId: newSession.id,
        messages: {
          ...state.messages,
          [newSession.id]: [],
        },
        error: null,
        errorCode: null,
        canRetry: false,
        canRegenerate: false,
        tokenUsage: { ...INITIAL_TOKEN_USAGE },
        confidenceScore: null,
      }));

      return newSession;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create copilot session';

      set({
        error: message,
        errorCode: 'CREATE_SESSION_ERROR',
      });

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
      tokenUsage: { ...INITIAL_TOKEN_USAGE },
      confidenceScore: null,
      canRetry: false,
      canRegenerate: false,
    });

    await get().loadMessages(sessionId, true);
  },

  renameSession: async (sessionId: string, title: string) => {
    try {
      await copilotService.renameSession(sessionId, title);

      set((state) => ({
        sessions: state.sessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                title,
                updated_at: new Date().toISOString(),
              }
            : session
        ),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rename session';

      set({
        error: message,
        errorCode: 'RENAME_SESSION_ERROR',
      });
    }
  },

  archiveSession: async (sessionId: string, isArchived = true) => {
    try {
      await copilotService.archiveSession(sessionId, isArchived);

      set((state) => ({
        sessions: state.sessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                is_archived: isArchived,
                updated_at: new Date().toISOString(),
              }
            : session
        ),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive session';

      set({
        error: message,
        errorCode: 'ARCHIVE_SESSION_ERROR',
      });
    }
  },

  togglePinSession: async (sessionId: string) => {
    const session = get().sessions.find((item) => item.id === sessionId);

    if (!session) {
      return;
    }

    const nextPinned = !session.is_pinned;

    try {
      await copilotService.togglePinSession(sessionId, nextPinned);

      set((state) => ({
        sessions: state.sessions.map((item) =>
          item.id === sessionId
            ? {
                ...item,
                is_pinned: nextPinned,
                updated_at: new Date().toISOString(),
              }
            : item
        ),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pin session';

      set({
        error: message,
        errorCode: 'PIN_SESSION_ERROR',
      });
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      await copilotService.deleteSession(sessionId);

      set((state) => {
        const remaining = state.sessions.filter((session) => session.id !== sessionId);

        const nextActiveId =
          state.activeSessionId === sessionId
            ? remaining.length > 0
              ? remaining[0].id
              : null
            : state.activeSessionId;

        const newMessages = {
          ...state.messages,
        };

        delete newMessages[sessionId];

        return {
          sessions: remaining,
          activeSessionId: nextActiveId,
          messages: newMessages,
          selectedCitation: null,
          isCitationDrawerOpen: false,
        };
      });

      const nextId = get().activeSessionId;

      if (nextId) {
        await get().loadMessages(nextId, true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete session';

      set({
        error: message,
        errorCode: 'DELETE_SESSION_ERROR',
      });
    }
  },

  // ---------------------------------------------------------------------------
  // Messages
  // ---------------------------------------------------------------------------

  loadMessages: async (sessionId: string, force = false) => {
    if (!force && get().messages[sessionId]?.length > 0) {
      const msgs = get().messages[sessionId] || [];

      const lastMsg = msgs[msgs.length - 1];

      set({
        canRegenerate: lastMsg?.role === 'assistant' && !get().isStreaming,
        canRetry: Boolean(lastMsg?.error),
      });

      return;
    }

    set({
      isLoadingMessages: true,
      error: null,
    });

    try {
      const msgs = await copilotService.loadMessages(sessionId);

      set((state) => ({
        messages: {
          ...state.messages,
          [sessionId]: msgs,
        },
        isLoadingMessages: false,
        canRegenerate: msgs.length > 0 && msgs[msgs.length - 1]?.role === 'assistant',
        canRetry: msgs.length > 0 && Boolean(msgs[msgs.length - 1]?.error),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load messages';

      set({
        error: message,
        errorCode: 'LOAD_MESSAGES_ERROR',
        isLoadingMessages: false,
      });
    }
  },

  // ---------------------------------------------------------------------------
  // Send / stream prompt
  // ---------------------------------------------------------------------------

  sendPrompt: async (promptText: string) => {
    const activeId = get().activeSessionId;

    if (!activeId) {
      set({
        error: 'No active session selected',
        errorCode: 'NO_ACTIVE_SESSION',
      });

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
      isOptimistic: true,
      citations: [],
      model: get().currentModel,
    };

    // Add optimistic messages immediately.
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
        tokenUsage: { ...INITIAL_TOKEN_USAGE },
      };
    });

    try {
      await copilotService.streamResponse(
        activeId,
        promptText,
        {
          // ---------------------------------------------------------------
          // Start
          // ---------------------------------------------------------------

          onStart: () => {
            set((state) => {
              const msgs = state.messages[activeId] || [];

              return {
                messages: {
                  ...state.messages,
                  [activeId]: msgs.map((message) =>
                    message.id === asstMsgId
                      ? {
                          ...message,
                          isStreaming: true,
                        }
                      : message
                  ),
                },
              };
            });
          },

          // ---------------------------------------------------------------
          // Token
          // ---------------------------------------------------------------

          onToken: (token) => {
            if (!token) {
              return;
            }

            set((state) => {
              const msgs = state.messages[activeId] || [];

              return {
                messages: {
                  ...state.messages,
                  [activeId]: msgs.map((message) =>
                    message.id === asstMsgId
                      ? {
                          ...message,
                          content: (message.content || '') + token,
                        }
                      : message
                  ),
                },
              };
            });
          },

          // ---------------------------------------------------------------
          // Citations
          // ---------------------------------------------------------------

          onCitation: (citations: CopilotCitation[]) => {
            set((state) => {
              const msgs = state.messages[activeId] || [];

              return {
                messages: {
                  ...state.messages,
                  [activeId]: msgs.map((message) =>
                    message.id === asstMsgId
                      ? {
                          ...message,
                          citations: [...(message.citations || []), ...citations],
                        }
                      : message
                  ),
                },
              };
            });
          },

          // ---------------------------------------------------------------
          // Confidence
          // ---------------------------------------------------------------

          onConfidence: (confidence) => {
            set((state) => {
              const msgs = state.messages[activeId] || [];

              return {
                confidenceScore: confidence,

                messages: {
                  ...state.messages,
                  [activeId]: msgs.map((message) =>
                    message.id === asstMsgId
                      ? {
                          ...message,
                          confidence,
                        }
                      : message
                  ),
                },
              };
            });
          },

          // ---------------------------------------------------------------
          // Suggested questions
          // ---------------------------------------------------------------

          onSuggestedQuestions: (questions) => {
            set((state) => {
              const msgs = state.messages[activeId] || [];

              return {
                messages: {
                  ...state.messages,
                  [activeId]: msgs.map((message) =>
                    message.id === asstMsgId
                      ? {
                          ...message,
                          suggested_questions: questions,
                        }
                      : message
                  ),
                },
              };
            });
          },

          // ---------------------------------------------------------------
          // Usage
          // ---------------------------------------------------------------

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
                  [activeId]: msgs.map((message) =>
                    message.id === asstMsgId
                      ? {
                          ...message,
                          usage,
                        }
                      : message
                  ),
                },
              };
            });
          },

          // ---------------------------------------------------------------
          // Done
          // ---------------------------------------------------------------

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
                  [activeId]: msgs.map((message) =>
                    message.id === asstMsgId
                      ? {
                          ...message,
                          isStreaming: false,
                          isOptimistic: false,
                        }
                      : message
                  ),
                },
              };
            });
          },

          // ---------------------------------------------------------------
          // Error
          // ---------------------------------------------------------------

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
                  [activeId]: msgs.map((message) =>
                    message.id === asstMsgId
                      ? {
                          ...message,
                          isStreaming: false,
                          error: err.error,
                        }
                      : message
                  ),
                },
              };
            });
          },
        },
        controller.signal
      );

      // ---------------------------------------------------------------------
      // Reconcile optimistic streamed UI with the persisted server response.
      //
      // This is intentionally done only AFTER streamCopilotChat resolves.
      // The backend has already persisted the assistant message by this point.
      // ---------------------------------------------------------------------

      try {
        await get().loadMessages(activeId, true);
      } catch {
        // Keep the already-rendered streamed response
        // if server reconciliation fails.
      }

      // ---------------------------------------------------------------------
      // Make sure the final stream state is clean even if the server
      // reconciliation replaced the optimistic assistant object.
      // ---------------------------------------------------------------------

      set({
        isStreaming: false,
        streamingMessageId: null,
        abortController: null,
        canRegenerate: true,
        canRetry: false,
      });
    } catch (err) {
      // User manually stopped generation.
      if (controller.signal.aborted) {
        set((state) => {
          const msgs = state.messages[activeId] || [];

          return {
            isStreaming: false,
            streamingMessageId: null,
            abortController: null,

            canRegenerate: msgs.some(
              (message) => message.id === asstMsgId && Boolean(message.content)
            ),

            messages: {
              ...state.messages,
              [activeId]: msgs.map((message) =>
                message.id === asstMsgId
                  ? {
                      ...message,
                      isStreaming: false,
                    }
                  : message
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
          canRegenerate: false,

          messages: {
            ...state.messages,
            [activeId]: msgs.map((item) =>
              item.id === asstMsgId
                ? {
                    ...item,
                    isStreaming: false,
                    error: message,
                  }
                : item
            ),
          },
        };
      });
    }
  },

  // ---------------------------------------------------------------------------
  // Stop generation
  // ---------------------------------------------------------------------------

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
              [activeId]: msgs.map((message) =>
                message.id === streamingId
                  ? {
                      ...message,
                      isStreaming: false,
                    }
                  : message
              ),
            }
          : state.messages,
      };
    });
  },

  // ---------------------------------------------------------------------------
  // Regenerate
  // ---------------------------------------------------------------------------

  regenerateResponse: async () => {
    const activeId = get().activeSessionId;

    if (!activeId || get().isStreaming) {
      return;
    }

    const msgs = get().messages[activeId] || [];

    const lastUserMsg = [...msgs].reverse().find((message) => message.role === 'user');

    if (!lastUserMsg) {
      return;
    }

    // Remove the last assistant message.
    set((state) => {
      const updatedMsgs = state.messages[activeId] || [];

      const trimmed = updatedMsgs.filter(
        (message, index) => !(index === updatedMsgs.length - 1 && message.role === 'assistant')
      );

      return {
        messages: {
          ...state.messages,
          [activeId]: trimmed,
        },

        error: null,
        errorCode: null,

        canRetry: false,
        canRegenerate: false,
      };
    });

    await get().sendPrompt(lastUserMsg.content);
  },

  // ---------------------------------------------------------------------------
  // Retry
  // ---------------------------------------------------------------------------

  retryResponse: async () => {
    const activeId = get().activeSessionId;

    if (!activeId || get().isStreaming) {
      return;
    }

    const msgs = get().messages[activeId] || [];

    const lastUserMsg = [...msgs].reverse().find((message) => message.role === 'user');

    if (!lastUserMsg) {
      return;
    }

    await get().regenerateResponse();
  },

  // ---------------------------------------------------------------------------
  // UI state
  // ---------------------------------------------------------------------------

  setSearchQuery: (searchQuery: string) => {
    set({ searchQuery });
  },

  setFilter: (filter: CopilotFilter) => {
    set({ filter });
  },

  setSelectedCitation: (citation: CopilotCitation | null) => {
    set({
      selectedCitation: citation,
      isCitationDrawerOpen: Boolean(citation),
    });
  },

  toggleSidebar: () => {
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    }));
  },

  setCurrentModel: (currentModel: CopilotModel) => {
    set({ currentModel });
  },

  clearError: () => {
    set({
      error: null,
      errorCode: null,
    });
  },

  reset: () => {
    const controller = get().abortController;

    if (controller) {
      controller.abort();
    }

    set({
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

      tokenUsage: {
        ...INITIAL_TOKEN_USAGE,
      },

      confidenceScore: null,

      canRetry: false,
      canRegenerate: false,

      abortController: null,
    });
  },
}));

export default useCopilotStore;
