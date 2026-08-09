import { copilotApi, streamCopilotChat } from '../../../api/copilotApi';
import {
  CopilotSession,
  CopilotMessage,
  CopilotStreamCallbacks,
} from '../types';

class CopilotService {
  /**
   * List conversation sessions
   */
  async listSessions(isArchived = false): Promise<CopilotSession[]> {
    const sessions = await copilotApi.getSessions(isArchived);
    return sessions as CopilotSession[];
  }

  /**
   * Create a new chat session
   */
  async createSession(title = 'New Investigation', isPinned = false): Promise<CopilotSession> {
    const session = await copilotApi.createSession({ title, is_pinned: isPinned });
    return session as CopilotSession;
  }

  /**
   * Rename an existing session
   */
  async renameSession(sessionId: string, title: string): Promise<CopilotSession> {
    const session = await copilotApi.updateSession(sessionId, { title });
    return session as CopilotSession;
  }

  /**
   * Archive or unarchive a session
   */
  async archiveSession(sessionId: string, isArchived = true): Promise<CopilotSession> {
    const session = await copilotApi.updateSession(sessionId, { is_archived: isArchived });
    return session as CopilotSession;
  }

  /**
   * Toggle pin status on a session
   */
  async togglePinSession(sessionId: string, isPinned: boolean): Promise<CopilotSession> {
    const session = await copilotApi.updateSession(sessionId, { is_pinned: isPinned });
    return session as CopilotSession;
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await copilotApi.deleteSession(sessionId);
  }

  /**
   * Load message history for a session
   */
  async loadMessages(sessionId: string): Promise<CopilotMessage[]> {
    const messages = await copilotApi.getMessages(sessionId);
    return messages as CopilotMessage[];
  }

  /**
   * Synchronous fallback prompt execution
   */
  async sendPrompt(sessionId: string, prompt: string): Promise<CopilotMessage> {
    const message = await copilotApi.sendChatMessageSync(sessionId, prompt);
    return message as CopilotMessage;
  }

  /**
   * Regenerate response for the latest turn
   */
  async regenerateResponse(sessionId: string): Promise<CopilotMessage> {
    return this.sendPrompt(
      sessionId,
      'Please regenerate and elaborate on the previous analysis with technical specifics.'
    );
  }

  /**
   * Retry sending prompt after an error
   */
  async retryResponse(sessionId: string, prompt: string): Promise<CopilotMessage> {
    return this.sendPrompt(sessionId, prompt);
  }

  /**
   * Stream assistant response token-by-token with Server-Sent Events (SSE).
   */
  async streamResponse(
    sessionId: string,
    messageText: string,
    callbacks: CopilotStreamCallbacks,
    signal?: AbortSignal,
    maxRetries = 2
  ): Promise<void> {
    await streamCopilotChat(sessionId, messageText, callbacks, signal, maxRetries);
  }
}

export const copilotService = new CopilotService();