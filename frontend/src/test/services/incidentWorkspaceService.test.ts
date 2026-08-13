import { describe, it, expect, vi, beforeEach } from 'vitest';
import { incidentWorkspaceService } from '../../features/incidents/services/incidentWorkspaceService';
import apiClient from '../../api/client';

// Mock the apiClient
vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('IncidentWorkspaceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadRecommendations', () => {
    it('should return mapped recommendations on successful AI analysis', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          status: 'completed',
          confidence_score: 0.95,
          recommended_actions: ['Restart pod', 'Check logs'],
          updated_at: '2024-01-01T00:00:00Z',
        },
      });

      const result = await incidentWorkspaceService.loadRecommendations('inc-123');
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Restart pod');
      expect(result[0].confidence).toBe(95);
      expect(result[0].action_type).toBe('MANUAL');
      expect(result[1].title).toBe('Check logs');
    });

    it('should return empty array when status is pending', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { status: 'pending' },
      });
      const result = await incidentWorkspaceService.loadRecommendations('inc-123');
      expect(result).toEqual([]);
    });

    it('should handle missing data gracefully', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { status: 'completed' }, // No recommended_actions
      });
      const result = await incidentWorkspaceService.loadRecommendations('inc-123');
      expect(result).toEqual([]);
    });

    it('should return empty array on failure', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));
      const result = await incidentWorkspaceService.loadRecommendations('inc-123');
      expect(result).toEqual([]);
    });
  });

  describe('loadRCA', () => {
    it('should return mapped RCA on successful AI analysis', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          status: 'completed',
          summary: 'DB Outage',
          root_cause_analysis: 'OOM Killed',
          confidence_score: 0.88,
          recommended_actions: ['Scale memory'],
          updated_at: '2024-01-01T00:00:00Z',
        },
      });

      const result = await incidentWorkspaceService.loadRCA('inc-123');
      expect(result).not.toBeNull();
      expect(result!.summary).toBe('DB Outage');
      expect(result!.ai_explanation).toBe('OOM Killed');
      expect(result!.confidence).toBe(88);
      expect(result!.recommended_remediation).toEqual(['Scale memory']);
    });

    it('should return null when status is pending', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { status: 'pending' },
      });
      const result = await incidentWorkspaceService.loadRCA('inc-123');
      expect(result).toBeNull();
    });

    it('should return null on failure', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));
      const result = await incidentWorkspaceService.loadRCA('inc-123');
      expect(result).toBeNull();
    });
  });

  describe('loadSimilarIncidents', () => {
    it('should return mapped similar incidents on successful AI analysis', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          status: 'completed',
          similar_incidents: [
            {
              id: 'inc-999',
              title: 'Previous DB Outage',
              similarity: 0.9123,
              resolved_in_mins: 45,
              severity: 'HIGH',
              status: 'RESOLVED',
              root_cause_summary: 'Scaled up DB instance',
            },
          ],
        },
      });

      const result = await incidentWorkspaceService.loadSimilarIncidents('inc-123');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Previous DB Outage');
      expect(result[0].similarity_score).toBe(91); // Math.round(0.9123 * 100)
    });

    it('should return empty array when similar_incidents is missing or empty', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { status: 'completed' },
      });
      const result = await incidentWorkspaceService.loadSimilarIncidents('inc-123');
      expect(result).toEqual([]);
    });

    it('should return empty array on failure', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));
      const result = await incidentWorkspaceService.loadSimilarIncidents('inc-123');
      expect(result).toEqual([]);
    });
  });
});
