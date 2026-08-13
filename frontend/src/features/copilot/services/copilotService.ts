import { copilotApi, streamCopilotChat } from '../../../api/copilotApi';

import type {
  ChatMessage,
  ChatSession,
  StreamCallbacks,
  CopilotResponse,
} from '../../../types/chat';

/**
 * Convert the backend CopilotResponse DTO into the frontend ChatMessage DTO.
 *
 * Backend:
 *   message_id
 *
 * Frontend:
 *   id
 *
 * The backend response does not currently expose created_at,
 * so the client creates it when the response is received.
 */
function toChatMessage(response: CopilotResponse): ChatMessage {
  return {
    id: response.message_id,
    created_at: new Date().toISOString(),
    session_id: response.session_id,
    role: response.role,
    content: response.content,
    tokens: response.tokens,
    prompt_tokens: response.prompt_tokens,
    completion_tokens: response.completion_tokens,
    citations: response.citations ?? [],
    confidence: response.confidence,
    suggested_questions: response.suggested_questions ?? [],
    usage: response.usage ?? undefined,
  };
}

export const copilotService = {
  /**
   * List Copilot conversation sessions.
   *
   * Kept as listSessions because the existing store/tests
   * depend on this public service method.
   */
  async listSessions(isArchived?: boolean): Promise<ChatSession[]> {
    return copilotApi.getSessions(isArchived);
  },

  /**
   * Alias for listSessions.
   */
  async getSessions(isArchived?: boolean): Promise<ChatSession[]> {
    return copilotApi.getSessions(isArchived);
  },

  /**
   * Get a single conversation session.
   */
  async getSession(sessionId: string): Promise<ChatSession> {
    return copilotApi.getSession(sessionId);
  },

  /**
   * Create a new conversation session.
   */
  async createSession(title?: string, isPinned = false): Promise<ChatSession> {
    return copilotApi.createSession({
      title,
      is_pinned: isPinned,
    });
  },

  /**
   * Rename a conversation session.
   */
  async renameSession(sessionId: string, title: string): Promise<ChatSession> {
    return copilotApi.updateSession(sessionId, {
      title,
    });
  },

  /**
   * Archive or unarchive a conversation session.
   */
  async archiveSession(sessionId: string, isArchived: boolean): Promise<ChatSession> {
    return copilotApi.updateSession(sessionId, {
      is_archived: isArchived,
    });
  },

  /**
   * Pin or unpin a conversation session.
   */
  async togglePinSession(sessionId: string, isPinned: boolean): Promise<ChatSession> {
    return copilotApi.updateSession(sessionId, {
      is_pinned: isPinned,
    });
  },

  /**
   * Update a conversation session.
   */
  async updateSession(
    sessionId: string,
    payload: {
      title?: string;
      is_pinned?: boolean;
      is_archived?: boolean;
    }
  ): Promise<ChatSession> {
    return copilotApi.updateSession(sessionId, payload);
  },

  /**
   * Delete a conversation session.
   */
  async deleteSession(sessionId: string): Promise<void> {
    return copilotApi.deleteSession(sessionId);
  },

  /**
   * Load message history.
   *
   * Kept as loadMessages because the existing store/tests
   * depend on this method name.
   */
  async loadMessages(sessionId: string): Promise<ChatMessage[]> {
    return copilotApi.getMessages(sessionId);
  },

  /**
   * Alias for loadMessages.
   */
  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    return copilotApi.getMessages(sessionId);
  },

  /**
   * Send a synchronous Copilot message.
   *
   * IMPORTANT:
   * The API returns CopilotResponse, not ChatMessage.
   * We explicitly map the backend DTO into the frontend DTO.
   */
  async sendMessage(sessionId: string, message: string): Promise<ChatMessage> {
    const response = await copilotApi.sendChatMessageSync(sessionId, message);

    return toChatMessage(response);
  },

  /**
   * Explicit synchronous API method.
   */
  async sendChatMessageSync(sessionId: string, message: string): Promise<ChatMessage> {
    const response = await copilotApi.sendChatMessageSync(sessionId, message);

    return toChatMessage(response);
  },

  /**
   * Stream Copilot response.
   *
   * Kept as streamResponse because the existing store depends
   * on this method name.
   */
  async streamResponse(
    sessionId: string,
    message: string,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    return streamCopilotChat(sessionId, message, callbacks, signal);
  },

  /**
   * Alias for streamResponse.
   */
  async streamMessage(
    sessionId: string,
    message: string,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    return streamCopilotChat(sessionId, message, callbacks, signal);
  },
};
