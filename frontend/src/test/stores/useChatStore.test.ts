import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChatStore } from '../../stores/useChatStore';
import { copilotApi } from '../../api/copilotApi';

vi.mock('../../api/copilotApi', () => ({
  copilotApi: {
    getSessions: vi.fn(),
    createSession: vi.fn(),
    getSession: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
    getMessages: vi.fn(),
  },
  streamCopilotChat: vi.fn(),
}));

describe('useChatStore - Zustand state actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.setState({
      sessions: [],
      activeSessionId: null,
      messages: {},
      isStreaming: false,
      streamingMessageId: null,
      error: null,
    });
  });

  it('should load sessions and set activeSessionId to the first session', async () => {
    const mockSessions = [
      {
        id: 'sess-1',
        title: 'Test Chat 1',
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
      },
      {
        id: 'sess-2',
        title: 'Test Chat 2',
        created_at: '2026-08-02T10:00:00Z',
        updated_at: '2026-08-02T10:00:00Z',
      },
    ];
    vi.mocked(copilotApi.getSessions).mockResolvedValueOnce(mockSessions);
    vi.mocked(copilotApi.getMessages).mockResolvedValueOnce([]);

    await useChatStore.getState().loadSessions();

    expect(useChatStore.getState().sessions).toHaveLength(2);
    expect(useChatStore.getState().activeSessionId).toBe('sess-1');
  });

  it('should create a new session and prepend to sessions list', async () => {
    const createdSession = {
      id: 'sess-new',
      title: 'New AI Conversation',
      created_at: '2026-08-03T10:00:00Z',
      updated_at: '2026-08-03T10:00:00Z',
    };
    vi.mocked(copilotApi.createSession).mockResolvedValueOnce(createdSession);

    const result = await useChatStore.getState().createSession('New AI Conversation');
    expect(result.id).toBe('sess-new');
    expect(useChatStore.getState().sessions[0].id).toBe('sess-new');
    expect(useChatStore.getState().activeSessionId).toBe('sess-new');
  });

  it('should toggle pin state and call updateSession API', async () => {
    const testSession = {
      id: 'sess-1',
      title: 'Test',
      is_pinned: false,
      created_at: '2026-08-01T10:00:00Z',
      updated_at: '2026-08-01T10:00:00Z',
    };
    useChatStore.setState({ sessions: [testSession] });
    vi.mocked(copilotApi.updateSession).mockResolvedValueOnce({ ...testSession, is_pinned: true });

    await useChatStore.getState().togglePinSession('sess-1');
    expect(useChatStore.getState().sessions[0].is_pinned).toBe(true);
    expect(copilotApi.updateSession).toHaveBeenCalledWith('sess-1', { is_pinned: true });
  });

  it('should delete a session and select next session if active was deleted', async () => {
    const s1 = { id: 'sess-1', title: 'S1', created_at: '', updated_at: '' };
    const s2 = { id: 'sess-2', title: 'S2', created_at: '', updated_at: '' };
    useChatStore.setState({
      sessions: [s1, s2],
      activeSessionId: 'sess-1',
      messages: { 'sess-1': [], 'sess-2': [] },
    });
    vi.mocked(copilotApi.deleteSession).mockResolvedValueOnce(undefined);

    await useChatStore.getState().deleteSession('sess-1');
    expect(useChatStore.getState().sessions).toHaveLength(1);
    expect(useChatStore.getState().activeSessionId).toBe('sess-2');
    expect(useChatStore.getState().messages['sess-1']).toBeUndefined();
  });

  it('should prevent duplicate streaming calls when isStreaming is true', async () => {
    useChatStore.setState({ isStreaming: true });

    await useChatStore.getState().sendMessage('Hello while streaming');
    expect(copilotApi.createSession).not.toHaveBeenCalled();
  });
});
