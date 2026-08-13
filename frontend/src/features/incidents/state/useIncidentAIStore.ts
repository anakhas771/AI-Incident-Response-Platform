import { create } from 'zustand';
import { IncidentRCA, IncidentRecommendation, SimilarIncidentCard } from '../types';

export type AIAnalysisStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

export interface IncidentAIStoreState {
  status: AIAnalysisStatus;
  summary: string | null;
  rootCause: IncidentRCA | null;
  recommendations: IncidentRecommendation[];
  similarIncidents: SimilarIncidentCard[];

  setStatus: (status: AIAnalysisStatus) => void;
  setSummary: (summary: string | null) => void;
  setRootCause: (rca: IncidentRCA | null) => void;
  setRecommendations: (recommendations: IncidentRecommendation[]) => void;
  setSimilarIncidents: (similarIncidents: SimilarIncidentCard[]) => void;
  resetAIState: () => void;
}

export const useIncidentAIStore = create<IncidentAIStoreState>((set) => ({
  status: 'idle',
  summary: null,
  rootCause: null,
  recommendations: [],
  similarIncidents: [],

  setStatus: (status) => set({ status }),
  setSummary: (summary) => set({ summary }),
  setRootCause: (rootCause) => set({ rootCause }),
  setRecommendations: (recommendations) => set({ recommendations }),
  setSimilarIncidents: (similarIncidents) => set({ similarIncidents }),
  resetAIState: () =>
    set({
      status: 'idle',
      summary: null,
      rootCause: null,
      recommendations: [],
      similarIncidents: [],
    }),
}));
