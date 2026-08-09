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

  it('listSessions should return sessions from API', async () => {
    const mockData = [{ id: 's-1', title: 'Test Session' }];
    vi.mocked(copilotApi.getSessions).mockResolvedValueOnce(mockData as never);

    const result = await copilotService.listSessions(false);

    expect(copilotApi.getSessions).toHaveBeenCalledWith(false);
    expect(result).toEqual(mockData);
  });

  it('listSessions should throw when API is unreachable', async () => {
    vi.mocked(copilotApi.getSessions).mockRejectedValueOnce(new Error('Network Error'));

    await expect(copilotService.listSessions(false)).rejects.toThrow('Network Error');
  });

  it('createSession should call API and return session', async () => {
    const mockData = { id: 's-2', title: 'New Investigation', is_pinned: true };
    vi.mocked(copilotApi.createSession).mockResolvedValueOnce(mockData as never);

    const result = await copilotService.createSession('New Investigation', true);

    expect(copilotApi.createSession).toHaveBeenCalledWith({ title: 'New Investigation', is_pinned: true });
    expect(result).toEqual(mockData);
  });

  it('loadMessages should throw when API is unreachable', async () => {
    vi.mocked(copilotApi.getMessages).mockRejectedValueOnce(new Error('Network Error'));
    await expect(copilotService.loadMessages('s-1')).rejects.toThrow('Network Error');
  });
});
