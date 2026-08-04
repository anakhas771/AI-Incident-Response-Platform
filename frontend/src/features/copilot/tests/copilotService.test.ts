import { describe, it, expect, beforeEach, vi } from 'vitest';
import { copilotService } from '../services/copilotService';
import { copilotApi } from '../../../api/copilotApi';

vi.mock('../../../api/copilotApi', () => ({
  copilotApi: {
    getSessions: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
    getMessages: vi.fn(),
    sendChatMessageSync: vi.fn(),
  },
  streamCopilotChat: vi.fn(),
}));

describe('copilotService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listSessions should return sessions from API when available', async () => {
    const mockData = [{ id: 's-1', title: 'Test Session' }];
    vi.mocked(copilotApi.getSessions).mockResolvedValueOnce(mockData as never);

    const result = await copilotService.listSessions(false);

    expect(copilotApi.getSessions).toHaveBeenCalledWith(false);
    expect(result).toEqual(mockData);
  });

  it('listSessions should fall back to offline mock sessions when API is unreachable', async () => {
    vi.mocked(copilotApi.getSessions).mockRejectedValueOnce(new Error('Network Error'));

    const result = await copilotService.listSessions(false);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('createSession should return offline session when API fails', async () => {
    vi.mocked(copilotApi.createSession).mockRejectedValueOnce(new Error('Offline'));

    const result = await copilotService.createSession('New Offline Investigation', true);

    expect(result.title).toBe('New Offline Investigation');
    expect(result.is_pinned).toBe(true);
    expect(result.id).toContain('session-offline-');
  });

  it('loadMessages should return mock messages when API is unreachable', async () => {
    vi.mocked(copilotApi.getMessages).mockRejectedValueOnce(new Error('Offline'));

    const result = await copilotService.loadMessages('session-copilot-1');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].role).toBe('user');
  });
});
