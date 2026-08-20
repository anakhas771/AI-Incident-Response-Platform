import { create } from 'zustand';
import { DashboardData, DashboardTimeframe } from '../types';

export interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  selectedTimeframe: DashboardTimeframe;
  lastUpdated: string | null;
  setData: (data: DashboardData) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setTimeframe: (timeframe: DashboardTimeframe) => void;
  reset: () => void;
}

const initialState = {
  data: null,
  isLoading: false,
  error: null,
  selectedTimeframe: '24h' as DashboardTimeframe,
  lastUpdated: null,
};

export const useDashboardStore = create<DashboardState>((set) => ({
  ...initialState,

  setData: (data: DashboardData) =>
    set({
      data,
      isLoading: false,
      error: null,
      lastUpdated: new Date().toISOString(),
    }),

  setLoading: (isLoading: boolean) =>
    set({
      isLoading,
    }),

  setError: (error: string | null) =>
    set({
      error,
      isLoading: false,
    }),

  setTimeframe: (selectedTimeframe: DashboardTimeframe) =>
    set({
      selectedTimeframe,
    }),

  reset: () => set(initialState),
}));

export default useDashboardStore;
