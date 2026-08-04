import { describe, it, expect } from 'vitest';
import { apiClient } from '../../api/client';

describe('API Client', () => {
  it('should have correct default baseURL and timeout', () => {
    expect(apiClient.defaults.baseURL).toBeDefined();
    expect(apiClient.defaults.timeout).toBe(30000);
  });

  it('should have JSON content type header configured', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });
});
