import { create } from 'zustand';
import { IncidentWorkspaceFilters, IncidentWorkspaceTab } from '../types';

export interface LoadingDomainMap {
  incident: boolean;
  timeline: boolean;
  recommendations: boolean;
  rca: boolean;
  similar: boolean;
  audit: boolean;
  attachments: boolean;
  comments: boolean;
  riskScore: boolean;
  systemMetadata: boolean;
}

export interface ErrorDomainMap {
  incident: string | null;
  timeline: string | null;
  recommendations: string | null;
  rca: string | null;
  similar: string | null;
  audit: string | null;
  attachments: string | null;
  comments: string | null;
  riskScore: string | null;
  systemMetadata: string | null;
}

export interface IncidentUIStoreState {
  selectedTab: IncidentWorkspaceTab;
  filters: IncidentWorkspaceFilters;
  loading: LoadingDomainMap;
  errors: ErrorDomainMap;

  setSelectedTab: (tab: IncidentWorkspaceTab) => void;
  setFilters: (filters: Partial<IncidentWorkspaceFilters>) => void;
  setLoading: (loading: Partial<LoadingDomainMap>) => void;
  setError: (errors: Partial<ErrorDomainMap>) => void;
  clearErrors: () => void;
  resetUIState: () => void;
}

const initialLoading: LoadingDomainMap = {
  incident: false,
  timeline: false,
  recommendations: false,
  rca: false,
  similar: false,
  audit: false,
  attachments: false,
  comments: false,
  riskScore: false,
  systemMetadata: false,
};

const initialErrors: ErrorDomainMap = {
  incident: null,
  timeline: null,
  recommendations: null,
  rca: null,
  similar: null,
  audit: null,
  attachments: null,
  comments: null,
  riskScore: null,
  systemMetadata: null,
};

const initialFilters: IncidentWorkspaceFilters = {
  search: '',
  event_type: 'ALL',
  only_ai: false,
};

export const useIncidentUIStore = create<IncidentUIStoreState>((set) => ({
  selectedTab: 'overview',
  filters: initialFilters,
  loading: initialLoading,
  errors: initialErrors,

  setSelectedTab: (selectedTab) => set({ selectedTab }),
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  setLoading: (newLoading) =>
    set((state) => ({
      loading: { ...state.loading, ...newLoading },
    })),
  setError: (newErrors) =>
    set((state) => ({
      errors: { ...state.errors, ...newErrors },
    })),
  clearErrors: () => set({ errors: initialErrors }),
  resetUIState: () =>
    set({
      selectedTab: 'overview',
      filters: initialFilters,
      loading: initialLoading,
      errors: initialErrors,
    }),
}));
