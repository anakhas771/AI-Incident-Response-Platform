/**
 * RefreshManager: Event-driven background refresh / polling manager.
 * Decouples timer/update mechanisms from UI components.
 * EPIC 7 (Realtime SSE) can hook directly into this manager without changing UI components.
 */
export type RefreshSubscriber = (incidentId: string) => Promise<void> | void;

export class RefreshManager {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private currentIncidentId: string | null = null;
  private intervalMs: number = 10000;
  private subscribers: Set<RefreshSubscriber> = new Set();
  private isRunning: boolean = false;

  constructor(defaultIntervalMs: number = 10000) {
    this.intervalMs = defaultIntervalMs;
  }

  public start(incidentId: string, intervalMs?: number): void {
    if (intervalMs && intervalMs > 0) {
      this.intervalMs = intervalMs;
    }
    this.currentIncidentId = incidentId;
    this.stopTimer();

    this.isRunning = true;
    this.timerId = setInterval(() => {
      if (this.isRunning && this.currentIncidentId) {
        this.notifySubscribers(this.currentIncidentId);
      }
    }, this.intervalMs);
  }

  public stop(): void {
    this.isRunning = false;
    this.stopTimer();
  }

  public restart(incidentId: string, intervalMs?: number): void {
    this.stop();
    this.start(incidentId, intervalMs);
  }

  public changeInterval(newIntervalMs: number): void {
    this.intervalMs = newIntervalMs;
    if (this.isRunning && this.currentIncidentId) {
      this.restart(this.currentIncidentId, newIntervalMs);
    }
  }

  public subscribe(subscriber: RefreshSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  public async notifySubscribers(incidentId: string): Promise<void> {
    const promises = Array.from(this.subscribers).map((sub) => {
      try {
        return Promise.resolve(sub(incidentId));
      } catch (err) {
        console.error('[RefreshManager] Subscriber error:', err);
        return Promise.resolve();
      }
    });
    await Promise.allSettled(promises);
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIntervalMs(): number {
    return this.intervalMs;
  }

  public getIncidentId(): string | null {
    return this.currentIncidentId;
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export const defaultRefreshManager = new RefreshManager(10000);
