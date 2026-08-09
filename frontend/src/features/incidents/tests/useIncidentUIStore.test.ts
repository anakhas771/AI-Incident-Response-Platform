import { beforeEach, describe, expect, it } from 'vitest';
import { useIncidentUIStore } from '../state/useIncidentUIStore';

describe('useIncidentUIStore', () => {
  beforeEach(() => {
    useIncidentUIStore.getState().resetUIState();
  });

  it('updates selected tab', () => {
    useIncidentUIStore.getState().setSelectedTab('rca');
    expect(useIncidentUIStore.getState().selectedTab).toBe('rca');
  });

  it('updates loading and error state maps', () => {
    useIncidentUIStore.getState().setLoading({ timeline: true });
    expect(useIncidentUIStore.getState().loading.timeline).toBe(true);

    useIncidentUIStore.getState().setError({ timeline: 'Failed to load timeline' });
    expect(useIncidentUIStore.getState().errors.timeline).toBe('Failed to load timeline');
  });
});
