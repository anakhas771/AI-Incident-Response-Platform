import { create } from 'zustand';

export interface IncidentPollingStoreState {
  enabled: boolean;
  intervalMs: number;
  lastUpdated: string | null;
  isRefreshing: boolean;

  setEnabled: (enabled: boolean) => void;
  setIntervalMs: (intervalMs: number) => void;
  setLastUpdated: (timestamp: string) => void;
  setIsRefreshing: (isRefreshing: boolean) => void;
  togglePolling: () => void;
  resetPollingState: () => void;
}

export const useIncidentPollingStore = create<IncidentPollingStoreState>((set) => ({
  enabled: true,
  intervalMs: 10000,
  lastUpdated: null,
  isRefreshing: false,

  setEnabled: (enabled) => set({ enabled }),
  setIntervalMs: (intervalMs) => set({ intervalMs }),
  setLastUpdated: (lastUpdated) => set({ lastUpdated }),
  setIsRefreshing: (isRefreshing) => set({ isRefreshing }),
  togglePolling: () => set((state) => ({ enabled: !state.enabled })),
  resetPollingState: () =>
    set({
      enabled: true,
      intervalMs: 10000,
      lastUpdated: null,
      isRefreshing: false,
    }),
}));
