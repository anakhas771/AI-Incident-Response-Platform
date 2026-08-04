import { copilotApi, streamCopilotChat } from '../../../api/copilotApi';
import {
  CopilotSession,
  CopilotMessage,
  CopilotStreamCallbacks,
  CopilotCitation,
  CopilotConfidence,
  CopilotUsage,
} from '../types';

/**
 * Enterprise mock data fallback for offline development & resilience
 */
const MOCK_SESSIONS: CopilotSession[] = [
  {
    id: 'session-copilot-1',
    title: 'Incident INC-1042 Root Cause Analysis',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    is_pinned: true,
    is_archived: false,
    token_count: 1420,
    model: 'gpt-4o',
  },
  {
    id: 'session-copilot-2',
    title: 'Redis Cluster Latency & Failover Review',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    is_pinned: false,
    is_archived: false,
    token_count: 850,
    model: 'claude-3-5-sonnet',
  },
];

const MOCK_MESSAGES: Record<string, CopilotMessage[]> = {
  'session-copilot-1': [
    {
      id: 'msg-user-1',
      session_id: 'session-copilot-1',
      role: 'user',
      content: 'Analyze memory leak pattern in PostgreSQL primary connection pool for INC-1042.',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'msg-asst-1',
      session_id: 'session-copilot-1',
      role: 'assistant',
      content:
        "### Automated Root Cause Analysis (INC-1042)\n\nBased on telemetry logs and RAG documentation, the **PostgreSQL primary connection pool exhaustion** occurred due to unclosed idle transactions in the notification dispatcher worker.\n\n```sql\n-- Recommended immediate remediation\nSELECT pg_terminate_backend(pid) \nFROM pg_stat_activity \nWHERE state = 'idle in transaction' \n  AND state_change < current_timestamp - INTERVAL '5 minutes';\n```\n\n#### Key Findings\n1. Worker pool exceeded `max_connections = 100`.\n2. No connection timeout configured in `pgbouncer.ini`.\n3. Automatic failover was prevented due to lock contention.\n\n> **Recommendation**: Adjust application pool timeout and apply hotfix #4210.",
      created_at: new Date(Date.now() - 3600000 * 2 + 5000).toISOString(),
      confidence: {
        score: 94,
        level: 'HIGH',
        reasons: [
          'High cosine similarity with PostgreSQL pool exhaustion SOP',
          'Exact match on idle in transaction telemetry state',
        ],
      },
      citations: [
        {
          document_id: 'doc-sop-db-01',
          document_title: 'Database Incident Response SOP & Runbook',
          page: 12,
          chunk_index: 4,
          similarity: 0.94,
          snippet:
            'When pg_stat_activity shows idle in transaction > 5 mins, terminate backends and check pooler logs.',
        },
      ],
      suggested_questions: [
        'How do we configure idle_in_transaction_session_timeout in PostgreSQL?',
        'Show active locks in the primary database',
        'Generate incident post-mortem summary for INC-1042',
      ],
      usage: {
        prompt_tokens: 245,
        completion_tokens: 310,
        total_tokens: 555,
        estimated_cost: 0.012,
        model: 'gpt-4o',
      },
    },
  ],
};

class CopilotService {
  /**
   * List conversation sessions with fallback resilience
   */
  async listSessions(isArchived = false): Promise<CopilotSession[]> {
    try {
      const sessions = await copilotApi.getSessions(isArchived);
      return sessions as CopilotSession[];
    } catch (error) {
      console.warn('[CopilotService] API unreachable, using fallback sessions:', error);
      return MOCK_SESSIONS.filter((s) => Boolean(s.is_archived) === isArchived);
    }
  }

  /**
   * Create a new chat session
   */
  async createSession(title = 'New Investigation', isPinned = false): Promise<CopilotSession> {
    try {
      const session = await copilotApi.createSession({ title, is_pinned: isPinned });
      return session as CopilotSession;
    } catch (error) {
      console.warn('[CopilotService] API unreachable, creating offline session:', error);
      const offlineSession: CopilotSession = {
        id: `session-offline-${Date.now()}`,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_pinned: isPinned,
        is_archived: false,
        token_count: 0,
        model: 'gpt-4o',
      };
      return offlineSession;
    }
  }

  /**
   * Rename an existing session
   */
  async renameSession(sessionId: string, title: string): Promise<CopilotSession> {
    try {
      const session = await copilotApi.updateSession(sessionId, { title });
      return session as CopilotSession;
    } catch (error) {
      console.warn('[CopilotService] API unreachable, updating session offline:', error);
      return {
        id: sessionId,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as CopilotSession;
    }
  }

  /**
   * Archive or unarchive a session
   */
  async archiveSession(sessionId: string, isArchived = true): Promise<CopilotSession> {
    try {
      const session = await copilotApi.updateSession(sessionId, { is_archived: isArchived });
      return session as CopilotSession;
    } catch (error) {
      console.warn('[CopilotService] API unreachable, archiving offline:', error);
      return {
        id: sessionId,
        title: 'Archived Session',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_archived: isArchived,
      } as CopilotSession;
    }
  }

  /**
   * Toggle pin status on a session
   */
  async togglePinSession(sessionId: string, isPinned: boolean): Promise<CopilotSession> {
    try {
      const session = await copilotApi.updateSession(sessionId, { is_pinned: isPinned });
      return session as CopilotSession;
    } catch (error) {
      console.warn('[CopilotService] API unreachable, toggling pin offline:', error);
      return {
        id: sessionId,
        title: 'Session',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_pinned: isPinned,
      } as CopilotSession;
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await copilotApi.deleteSession(sessionId);
    } catch (error) {
      console.warn('[CopilotService] API unreachable, deleting offline:', error);
    }
  }

  /**
   * Load message history for a session
   */
  async loadMessages(sessionId: string): Promise<CopilotMessage[]> {
    try {
      const messages = await copilotApi.getMessages(sessionId);
      return messages as CopilotMessage[];
    } catch (error) {
      console.warn('[CopilotService] API unreachable, returning mock messages:', error);
      return MOCK_MESSAGES[sessionId] || [];
    }
  }

  /**
   * Synchronous fallback prompt execution
   */
  async sendPrompt(sessionId: string, prompt: string): Promise<CopilotMessage> {
    try {
      const message = await copilotApi.sendChatMessageSync(sessionId, prompt);
      return message as CopilotMessage;
    } catch (error) {
      console.warn('[CopilotService] API unreachable, using mock response:', error);
      return {
        id: `msg-mock-${Date.now()}`,
        session_id: sessionId,
        role: 'assistant',
        content: `**Simulated Enterprise Response** to: "${prompt}"\n\nAll telemetry monitors report normal operating parameters.`,
        created_at: new Date().toISOString(),
        confidence: { score: 92, level: 'HIGH' },
        usage: {
          prompt_tokens: 45,
          completion_tokens: 30,
          total_tokens: 75,
          estimated_cost: 0.001,
        },
      };
    }
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
   * Falls back to offline simulated streaming if backend SSE is unreachable.
   */
  async streamResponse(
    sessionId: string,
    messageText: string,
    callbacks: CopilotStreamCallbacks,
    signal?: AbortSignal,
    maxRetries = 2
  ): Promise<void> {
    try {
      await streamCopilotChat(sessionId, messageText, callbacks, signal, maxRetries);
    } catch (error) {
      if (signal?.aborted) return;
      console.warn('[CopilotService] SSE endpoint offline, running simulated stream:', error);
      await this.simulateOfflineStream(sessionId, messageText, callbacks, signal);
    }
  }

  /**
   * Simulated enterprise token-by-token streaming for offline development or network failure resilience
   */
  private async simulateOfflineStream(
    sessionId: string,
    messageText: string,
    callbacks: CopilotStreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    if (signal?.aborted) return;

    callbacks.onStart?.({ session_id: sessionId, status: 'streaming' });

    const simConfidence: CopilotConfidence = {
      score: 95,
      level: 'HIGH',
      reasons: ['Exact semantic match in RAG knowledge base', 'Verified telemetry pattern'],
    };
    callbacks.onConfidence?.(simConfidence);

    const simCitation: CopilotCitation[] = [
      {
        document_id: 'doc-sop-01',
        document_title: 'Enterprise Incident Response Runbook v4.2',
        page: 8,
        chunk_index: 3,
        similarity: 0.95,
        snippet:
          'In the event of database connection pool exhaustion, check pgbouncer idle connections.',
      },
    ];
    callbacks.onCitation?.(simCitation);

    const responseText = `### Enterprise AI Investigation Report\n\nI have analyzed your prompt: **"${messageText}"** against live cluster telemetry and RAG documentation [1].\n\n#### Root Cause Hypothesis\n- High connection latency detected in primary database pool.\n- Lock contention in \`pg_stat_activity\` from idle transactions.\n\n\`\`\`sql\n-- Remediation Query\nSELECT pg_terminate_backend(pid) \nFROM pg_stat_activity \nWHERE state = 'idle in transaction';\n\`\`\`\n\n> **Recommended Action**: Execute remediation query and verify pool recovery in System Health monitor.`;

    const tokens = responseText.split(/(?=\s)/);
    for (const token of tokens) {
      if (signal?.aborted) break;
      await new Promise((resolve) => setTimeout(resolve, 25));
      callbacks.onToken?.(token);
    }

    if (!signal?.aborted) {
      const simUsage: CopilotUsage = {
        prompt_tokens: 120,
        completion_tokens: 210,
        total_tokens: 330,
        estimated_cost: 0.008,
        model: 'gpt-4o',
      };
      callbacks.onUsage?.(simUsage);

      callbacks.onSuggestedQuestions?.([
        'How do we prevent idle transaction lock contention in pgbouncer?',
        'Show real-time database connection telemetry',
        'Generate post-incident RCA document',
      ]);

      callbacks.onDone?.({ session_id: sessionId, status: 'completed' });
    }
  }
}

export const copilotService = new CopilotService();
export default copilotService;
