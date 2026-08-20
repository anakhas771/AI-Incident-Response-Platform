import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCopilotStore } from '../state/useCopilotStore';
import { copilotService } from '../services/copilotService';

vi.mock('../services/copilotService', () => ({
  copilotService: {
    listSessions: vi.fn(),
    createSession: vi.fn(),
    renameSession: vi.fn(),
    archiveSession: vi.fn(),
    togglePinSession: vi.fn(),
    deleteSession: vi.fn(),
    loadMessages: vi.fn(),
    streamResponse: vi.fn(),
  },
}));

describe('useCopilotStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCopilotStore.getState().reset();
  });

  it('should initialize with default state', () => {
    const state = useCopilotStore.getState();
    expect(state.sessions).toEqual([]);
    expect(state.activeSessionId).toBeNull();
    expect(state.messages).toEqual({});
    expect(state.isStreaming).toBe(false);
    expect(state.error).toBeNull();
    expect(state.canRetry).toBe(false);
    expect(state.canRegenerate).toBe(false);
    expect(state.currentModel).toBe('gpt-4o');
  });

  it('should load sessions and set active session automatically', async () => {
    const mockSessions = [
      {
        id: 's-1',
        title: 'Session 1',
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-08-01T00:00:00Z',
      },
      {
        id: 's-2',
        title: 'Session 2',
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-08-01T00:00:00Z',
      },
    ];
    vi.mocked(copilotService.listSessions).mockResolvedValueOnce(mockSessions as never);
    vi.mocked(copilotService.loadMessages).mockResolvedValueOnce([]);

    await useCopilotStore.getState().loadSessions();

    const state = useCopilotStore.getState();
    expect(state.sessions).toHaveLength(2);
    expect(state.activeSessionId).toBe('s-1');
    expect(state.isLoadingSessions).toBe(false);
  });

  it('should create a session immutably and set it as active', async () => {
    const mockCreated = {
      id: 's-new',
      title: 'New Investigation',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
      is_pinned: false,
    };
    vi.mocked(copilotService.createSession).mockResolvedValueOnce(mockCreated as never);

    const result = await useCopilotStore.getState().createSession('New Investigation');

    expect(result.id).toBe('s-new');
    const state = useCopilotStore.getState();
    expect(state.activeSessionId).toBe('s-new');
    expect(state.sessions[0].id).toBe('s-new');
    expect(state.messages['s-new']).toEqual([]);
  });

  it('should select a session and load its messages', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        session_id: 's-1',
        role: 'user',
        content: 'Hello Copilot',
        created_at: '2026-08-01T00:00:00Z',
      },
    ];
    vi.mocked(copilotService.loadMessages).mockResolvedValueOnce(mockMessages as never);

    await useCopilotStore.getState().selectSession('s-1');

    const state = useCopilotStore.getState();
    expect(state.activeSessionId).toBe('s-1');
    expect(state.messages['s-1']).toHaveLength(1);
    expect(state.messages['s-1'][0].content).toBe('Hello Copilot');
  });

  it('should handle search query and filter updates immutably', () => {
    useCopilotStore.getState().setSearchQuery('PostgreSQL');
    useCopilotStore.getState().setFilter('pinned');

    const state = useCopilotStore.getState();
    expect(state.searchQuery).toBe('PostgreSQL');
    expect(state.filter).toBe('pinned');
  });
});
