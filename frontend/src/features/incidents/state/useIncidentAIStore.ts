import { create } from 'zustand';
import { IncidentRCA, IncidentRecommendation, SimilarIncidentCard } from '../types';

export interface IncidentAIStoreState {
  rootCause: IncidentRCA | null;
  recommendations: IncidentRecommendation[];
  similarIncidents: SimilarIncidentCard[];

  setRootCause: (rca: IncidentRCA | null) => void;
  setRecommendations: (recommendations: IncidentRecommendation[]) => void;
  setSimilarIncidents: (similarIncidents: SimilarIncidentCard[]) => void;
  resetAIState: () => void;
}

export const useIncidentAIStore = create<IncidentAIStoreState>((set) => ({
  rootCause: null,
  recommendations: [],
  similarIncidents: [],

  setRootCause: (rootCause) => set({ rootCause }),
  setRecommendations: (recommendations) => set({ recommendations }),
  setSimilarIncidents: (similarIncidents) => set({ similarIncidents }),
  resetAIState: () =>
    set({
      rootCause: null,
      recommendations: [],
      similarIncidents: [],
    }),
}));
