import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getKnowledgeDocumentChunks,
  retryKnowledgeDocument,
  reindexKnowledgeDocument,
} from '../../services/knowledgeApi';
import apiClient from '../../api/client';

// Mock the apiClient
vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('knowledgeApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getKnowledgeDocumentChunks', () => {
    it('should return chunks successfully', async () => {
      const mockChunks = [{ id: 'chk-1', content: 'test chunk' }];
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockChunks });

      const result = await getKnowledgeDocumentChunks('doc-1');
      expect(result).toEqual(mockChunks);
      expect(apiClient.get).toHaveBeenCalledWith('/knowledge/doc-1/chunks/');
    });

    it('should return empty array on failure', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));

      const result = await getKnowledgeDocumentChunks('doc-2');
      expect(result).toEqual([]);
    });
  });

  describe('retryKnowledgeDocument', () => {
    it('should call retry endpoint and return status', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { status: 'Retry task queued.' } });

      const result = await retryKnowledgeDocument('doc-1');
      expect(result).toEqual({ status: 'Retry task queued.' });
      expect(apiClient.post).toHaveBeenCalledWith('/knowledge/doc-1/retry/');
    });
  });

  describe('reindexKnowledgeDocument', () => {
    it('should call reindex endpoint and return status', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { status: 'Re-index task queued.' },
      });

      const result = await reindexKnowledgeDocument('doc-2');
      expect(result).toEqual({ status: 'Re-index task queued.' });
      expect(apiClient.post).toHaveBeenCalledWith('/knowledge/doc-2/reindex/');
    });
  });
});
