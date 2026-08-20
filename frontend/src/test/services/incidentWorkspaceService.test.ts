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
    vi.resetAllMocks();
  });

  describe('loadAIAnalysis', () => {
    it('should return mapped analysis data on successful AI analysis', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          status: 'completed',
          summary: 'DB Outage',
          root_cause_analysis: 'OOM Killed',
          confidence_score: 0.95,
          recommended_actions: ['Restart pod', 'Check logs'],
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
          updated_at: '2024-01-01T00:00:00Z',
        },
      });

      const result = await incidentWorkspaceService.loadAIAnalysis('inc-123');
      expect(result.status).toBe('completed');
      expect(result.summary).toBe('DB Outage');
      expect(result.rca?.ai_explanation).toBe('OOM Killed');
      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0].title).toBe('Restart pod');
      expect(result.similarIncidents).toHaveLength(1);
      expect(result.similarIncidents[0].title).toBe('Previous DB Outage');
    });

    it('should return empty data when status is pending', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { status: 'pending' },
      });
      const result = await incidentWorkspaceService.loadAIAnalysis('inc-123');
      expect(result.status).toBe('pending');
      expect(result.rca).toBeNull();
      expect(result.recommendations).toEqual([]);
      expect(result.similarIncidents).toEqual([]);
    });

    it('should handle missing data gracefully', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { status: 'completed' },
      });
      const result = await incidentWorkspaceService.loadAIAnalysis('inc-123');
      expect(result.status).toBe('completed');
      expect(result.recommendations).toEqual([]);
      expect(result.similarIncidents).toEqual([]);
    });

    it('should propagate non-404 failures', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));

      await expect(incidentWorkspaceService.loadAIAnalysis('inc-123')).rejects.toThrow(
        'Network error'
      );
    });
  });
});
