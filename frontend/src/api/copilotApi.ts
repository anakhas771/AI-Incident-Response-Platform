
import { apiClient } from './client';
import {
  ChatSession,
  ChatMessage,
  CopilotResponse,
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
   * Fetch all conversation sessions for the authenticated user.
   */
  getSessions: async (isArchived?: boolean): Promise<ChatSession[]> => {
    const params =
      isArchived !== undefined ? { is_archived: isArchived } : undefined;

    const response = await apiClient.get<
      ChatSession[] | { results: ChatSession[] }
    >('/copilot/sessions/', { params });

    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (
      data &&
      typeof data === 'object' &&
      'results' in data &&
      Array.isArray(data.results)
    ) {
      return data.results;
    }

    return [];
  },

  /**
   * Create a new conversation session.
   */
  createSession: async (
    payload: CreateSessionPayload = {}
  ): Promise<ChatSession> => {
    const response = await apiClient.post<ChatSession>(
      '/copilot/sessions/',
      payload
    );

    return response.data;
  },

  /**
   * Retrieve details of a specific conversation session.
   */
  getSession: async (sessionId: string): Promise<ChatSession> => {
    const response = await apiClient.get<ChatSession>(
      `/copilot/sessions/${sessionId}/`
    );

    return response.data;
  },

  /**
   * Rename, pin/unpin, or archive a session.
   */
  updateSession: async (
    sessionId: string,
    payload: UpdateSessionPayload
  ): Promise<ChatSession> => {
    const response = await apiClient.patch<ChatSession>(
      `/copilot/sessions/${sessionId}/`,
      payload
    );

    return response.data;
  },

  /**
   * Delete a session.
   */
  deleteSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/copilot/sessions/${sessionId}/`);
  },

  /**
   * Retrieve message history for a session.
   */
  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get<
      ChatMessage[] | { results: ChatMessage[] }
    >(`/copilot/sessions/${sessionId}/messages/`);

    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (
      data &&
      typeof data === 'object' &&
      'results' in data &&
      Array.isArray(data.results)
    ) {
      return data.results;
    }

    return [];
  },

  /**
   * Synchronous fallback chat endpoint.
   *
   * The backend returns CopilotResponseSerializer,
   * so the response type must be CopilotResponse rather than ChatMessage.
   */
  sendChatMessageSync: async (
    sessionId: string,
    message: string
  ): Promise<CopilotResponse> => {
    const response = await apiClient.post<CopilotResponse>('/copilot/chat/', {
      session_id: sessionId,
      message,
    });

    return response.data;
  },
};

/**
 * Parse an SSE data block into its event type and JSON payload.
 *
 * Example:
 *
 * event: token
 * data: "Hello"
 *
 * becomes:
 *
 * {
 *   eventType: 'token',
 *   data: 'Hello'
 * }
 */
export function parseSSEBlock(
  block: string
): { eventType: string; data: unknown } | null {
  const lines = block.split(/\r?\n/);

  let eventType = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line) {
      continue;
    }

    if (line.startsWith(':')) {
      if (line.toLowerCase().includes('heartbeat')) {
        return {
          eventType: 'heartbeat',
          data: 'keep-alive',
        };
      }

      continue;
    }

    if (line.startsWith('event:')) {
      eventType = line.slice('event:'.length).trim();
      continue;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  }

  if (!eventType && dataLines.length === 0) {
    return null;
  }

  if (eventType === 'heartbeat') {
    return {
      eventType: 'heartbeat',
      data: 'keep-alive',
    };
  }

  const dataStr = dataLines.join('\n');

  if (!dataStr) {
    return {
      eventType,
      data: null,
    };
  }

  try {
    return {
      eventType,
      data: JSON.parse(dataStr),
    };
  } catch {
    return {
      eventType,
      data: dataStr,
    };
  }
}

/**
 * Convert an SSE token payload into a string.
 */
function normalizeTokenPayload(data: unknown): string {
  if (typeof data === 'string') {
    return data;
  }

  if (data === null || data === undefined) {
    return '';
  }

  if (typeof data === 'object') {
    const payload = data as Record<string, unknown>;

    if (typeof payload.content === 'string') {
      return payload.content;
    }

    if (typeof payload.token === 'string') {
      return payload.token;
    }

    if (typeof payload.text === 'string') {
      return payload.text;
    }
  }

  return String(data);
}

/**
 * Process one complete SSE block.
 */
function processSSEBlock(
  block: string,
  callbacks: StreamCallbacks
): boolean {
  const trimmed = block.trim();

  if (!trimmed) {
    return false;
  }

  const parsed = parseSSEBlock(trimmed);

  if (!parsed) {
    return false;
  }

  const { eventType, data } = parsed;

  switch (eventType) {
    case 'heartbeat':
      return false;

    case 'start':
      callbacks.onStart?.(
        data as {
          session_id: string;
          status: string;
        }
      );
      return false;

    case 'token': {
      const tokenText = normalizeTokenPayload(data);

      if (tokenText) {
        callbacks.onToken?.(tokenText);
      }

      return false;
    }

    case 'citation':
      callbacks.onCitation?.(data as ChatCitation[]);
      return false;

    case 'confidence':
      callbacks.onConfidence?.(data as ChatConfidence);
      return false;

    case 'suggested_questions':
      callbacks.onSuggestedQuestions?.(data as string[]);
      return false;

    case 'usage':
      callbacks.onUsage?.(data as ChatUsage);
      return false;

    case 'done':
      callbacks.onDone?.(
        data as {
          session_id: string;
          status: string;
        }
      );
      return true;

    case 'error': {
      const errObj =
        typeof data === 'object' && data !== null
          ? (data as { error: string; code?: string })
          : {
              error: String(data ?? 'Unknown streaming error'),
            };

      callbacks.onError?.(errObj);

      return true;
    }

    default:
      return false;
  }
}

/**
 * Production-grade SSE streaming client.
 *
 * Responsibilities:
 * - Authenticate the request.
 * - Connect to the Copilot SSE endpoint.
 * - Parse SSE frames.
 * - Forward token events to the UI.
 * - Handle citations, confidence, usage and suggested questions.
 * - Handle completion and errors.
 * - Retry transient connection failures.
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

  while (attempt <= maxRetries) {
    if (signal?.aborted) {
      return;
    }

    try {
      const token =
        useAuthStore.getState().token ||
        localStorage.getItem('access');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      };

      if (
        token &&
        !token.startsWith('mock-') &&
        !token.includes('mock-jwt')
      ) {
        headers.Authorization = `Bearer ${token}`;
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
            errMessage =
              typeof errJson.error === 'string'
                ? errJson.error
                : errJson.error.message;
          }
        } catch {
          // Keep HTTP status message.
        }

        throw new Error(errMessage);
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error(
          'ReadableStream is not supported by this browser.'
        );
      }

      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      let completed = false;

      while (!signal?.aborted) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        const parts = buffer.split(/\r?\n\r?\n/);

        buffer = parts.pop() || '';

        for (const part of parts) {
          const shouldStop = processSSEBlock(
            part,
            callbacks
          );

          if (shouldStop) {
            completed = true;
            break;
          }
        }

        if (completed) {
          try {
            await reader.cancel();
          } catch {
            // Reader cancellation is best effort.
          }

          return;
        }
      }

      /**
       * Flush any remaining decoder bytes.
       */
      buffer += decoder.decode();

      /**
       * Process the final SSE block if the server closed
       * the stream immediately after sending it.
       */
      if (!completed && buffer.trim()) {
        completed = processSSEBlock(buffer, callbacks);
      }

      if (completed) {
        return;
      }

      if (signal?.aborted) {
        return;
      }

      callbacks.onError?.({
        error: 'Stream disconnected before completion.',
        code: 'STREAM_PREMATURE_EOF',
      });

      return;
    } catch (err) {
      if (
        signal?.aborted ||
        (err instanceof DOMException &&
          err.name === 'AbortError')
      ) {
        return;
      }

      attempt += 1;

      if (attempt > maxRetries) {
        const errorMsg =
          err instanceof Error ? err.message : String(err);

        callbacks.onError?.({
          error: `Stream disconnected: ${errorMsg}`,
          code: 'STREAM_MAX_RETRIES_EXCEEDED',
        });

        return;
      }

      const delay = Math.pow(2, attempt - 1) * 500;

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }
}

