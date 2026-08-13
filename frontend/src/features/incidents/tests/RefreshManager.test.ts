import { describe, expect, it, vi } from 'vitest';
import { RefreshManager } from '../services/RefreshManager';

describe('RefreshManager', () => {
  it('manages timer lifecycle and notifies subscribers', async () => {
    const manager = new RefreshManager(100);
    const subscriber = vi.fn();

    const unsubscribe = manager.subscribe(subscriber);
    expect(manager.getIsRunning()).toBe(false);

    manager.start('INC-8902-771', 50);
    expect(manager.getIsRunning()).toBe(true);
    expect(manager.getIncidentId()).toBe('INC-8902-771');

    await new Promise((r) => setTimeout(r, 120));

    expect(subscriber).toHaveBeenCalled();

    manager.stop();
    expect(manager.getIsRunning()).toBe(false);

    unsubscribe();
  });
});
