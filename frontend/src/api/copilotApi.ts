import { apiClient } from './client';
import {
  ChatSession,
  ChatMessage,
  StreamCallbacks,
  ChatCitation,
  ChatConfidence,
  ChatUsage,
} from '../types/chat';
import { useAuthStore } from '../stores/useAuthStore';

export interface CreateSessionPayload {
  title?: string;
  is_pinned?: boolean;
}

export interface UpdateSessionPayload {
  title?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
}

export const copilotApi = {
  /**
   * Fetch all conversation sessions for the authenticated user
   */
  getSessions: async (isArchived?: boolean): Promise<ChatSession[]> => {
    const params = isArchived !== undefined ? { is_archived: isArchived } : undefined;
    const response = await apiClient.get<ChatSession[]>('/copilot/sessions/', { params });
    return response.data;
  },

  /**
   * Create a new conversation session
   */
  createSession: async (payload: CreateSessionPayload = {}): Promise<ChatSession> => {
    const response = await apiClient.post<ChatSession>('/copilot/sessions/', payload);
    return response.data;
  },

  /**
   * Retrieve details of a specific conversation session
   */
  getSession: async (sessionId: string): Promise<ChatSession> => {
    const response = await apiClient.get<ChatSession>(`/copilot/sessions/${sessionId}/`);
    return response.data;
  },

  /**
   * Rename, pin/unpin, or archive a session
   */
  updateSession: async (sessionId: string, payload: UpdateSessionPayload): Promise<ChatSession> => {
    const response = await apiClient.patch<ChatSession>(`/copilot/sessions/${sessionId}/`, payload);
    return response.data;
  },

  /**
   * Delete a session
   */
  deleteSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/copilot/sessions/${sessionId}/`);
  },

  /**
   * Retrieve message history for a session
   */
  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get<ChatMessage[]>(`/copilot/sessions/${sessionId}/messages/`);
    return response.data;
  },

  /**
   * Synchronous fallback chat endpoint
   */
  sendChatMessageSync: async (sessionId: string, message: string): Promise<ChatMessage> => {
    const response = await apiClient.post<ChatMessage>('/copilot/chat/', {
      session_id: sessionId,
      message,
    });
    return response.data;
  },
};

/**
 * Parse an SSE data block into its event type and JSON payload.
 */
export function parseSSEBlock(block: string): { eventType: string; data: unknown } | null {
  const lines = block.split('\n');
  let eventType = 'message';
  let dataStr = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(':')) {
      // Comment or heartbeat
      if (trimmed.includes('heartbeat')) {
        return { eventType: 'heartbeat', data: 'keep-alive' };
      }
      continue;
    }
    if (trimmed.startsWith('event:')) {
      eventType = trimmed.substring(6).trim();
    } else if (trimmed.startsWith('data:')) {
      dataStr += trimmed.substring(5).trim();
    }
  }

  if (!eventType && !dataStr) return null;
  if (eventType === 'heartbeat') return { eventType: 'heartbeat', data: 'keep-alive' };

  try {
    const data = dataStr ? JSON.parse(dataStr) : null;
    return { eventType, data };
  } catch {
    return { eventType, data: dataStr };
  }
}

/**
 * Production-grade SSE Streaming Client with cancellation, heartbeat filtering, and automatic exponential backoff reconnect logic.
 */
export async function streamCopilotChat(
  sessionId: string,
  message: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
  maxRetries = 2
): Promise<void> {
  const baseURL = apiClient.defaults.baseURL || '/api/v1';
  const url = `${baseURL.replace(/\/+$/, '')}/copilot/stream/`;

  let attempt = 0;
  let isDone = false;

  while (attempt <= maxRetries && !isDone) {
    if (signal?.aborted) {
      break;
    }

    try {
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          session_id: sessionId,
          message,
        }),
        signal,
      });

      if (!response.ok) {
        let errMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errJson = await response.json();
          if (errJson?.error?.message || errJson?.error) {
            errMessage = typeof errJson.error === 'string' ? errJson.error : errJson.error.message;
          }
        } catch {
          // Fallback to text status
        }
        throw new Error(errMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('ReadableStream not supported by response');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let isReading = true;

      while (isReading && !signal?.aborted) {
        const { done, value } = await reader.read();
        if (done) {
          isReading = false;
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by empty lines (\n\n or \r\n\r\n)
        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop() || ''; // Keep trailing incomplete block in buffer

        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;

          const parsed = parseSSEBlock(trimmed);
          if (!parsed) continue;

          const { eventType, data } = parsed;

          if (eventType === 'heartbeat') {
            continue; // Ignore heartbeat keep-alive
          } else if (eventType === 'start') {
            callbacks.onStart?.(data as { session_id: string; status: string });
          } else if (eventType === 'token') {
            const tokenText = typeof data === 'string' ? data : String(data || '');
            callbacks.onToken?.(tokenText);
          } else if (eventType === 'citation') {
            callbacks.onCitation?.(data as ChatCitation[]);
          } else if (eventType === 'confidence') {
            callbacks.onConfidence?.(data as ChatConfidence);
          } else if (eventType === 'suggested_questions') {
            callbacks.onSuggestedQuestions?.(data as string[]);
          } else if (eventType === 'usage') {
            callbacks.onUsage?.(data as ChatUsage);
          } else if (eventType === 'done') {
            isDone = true;
            callbacks.onDone?.(data as { session_id: string; status: string });
            return;
          } else if (eventType === 'error') {
            isDone = true;
            const errObj =
              typeof data === 'object' && data !== null
                ? (data as { error: string; code?: string })
                : { error: String(data) };
            callbacks.onError?.(errObj);
            return;
          }
        }
      }

      // If stream ended normally without done event, mark as done
      if (!isDone) {
        isDone = true;
        callbacks.onDone?.({ session_id: sessionId, status: 'completed' });
      }
      break;
    } catch (err) {
      if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
        // Stream aborted by user cancellation
        break;
      }

      attempt++;
      if (attempt > maxRetries) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        callbacks.onError?.({
          error: `Stream disconnected: ${errorMsg}`,
          code: 'STREAM_MAX_RETRIES_EXCEEDED',
        });
        break;
      }

      // Exponential backoff before reconnect attempt: 500ms, 1000ms...
      const delay = Math.pow(2, attempt - 1) * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
