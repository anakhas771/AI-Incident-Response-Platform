import { create } from 'zustand';
import { Category, Comment, Incident, Severity, Status, User } from '../types';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

interface IncidentFilterState {
  severity: Severity | 'ALL';
  status: Status | 'ALL';
  category: Category | 'ALL';
  search: string;
  assignedTo: string | 'ALL';
}

interface IncidentState {
  incidents: Incident[];
  selectedIncident: Incident | null;
  filters: IncidentFilterState;
  commentsMap: Record<string, Comment[]>;
  loadIncidents: () => Promise<void>;
  setSelectedIncident: (incident: Incident | null) => void;
  setFilters: (filters: Partial<IncidentFilterState>) => void;
  resetFilters: () => void;
  updateStatus: (id: string, newStatus: Status, user: User) => Promise<void>;
  assignUser: (id: string, assignee: User | null, user: User) => Promise<void>;
  addComment: (incidentId: string, message: string, author: User) => Promise<void>;
  getFilteredIncidents: () => Incident[];
}

const initialFilters: IncidentFilterState = {
  severity: 'ALL',
  status: 'ALL',
  category: 'ALL',
  search: '',
  assignedTo: 'ALL',
};

export const useIncidentStore = create<IncidentState>((set, get) => ({
  incidents: [],
  selectedIncident: null,
  filters: initialFilters,
  commentsMap: {},

  loadIncidents: async () => {
    const response = await apiClient.get<Incident[] | { results?: Incident[] }>('/incidents/');
    const incidents = Array.isArray(response.data) ? response.data : response.data.results || [];
    set((state) => ({
      incidents,
      selectedIncident:
        state.selectedIncident && incidents.some((incident) => incident.id === state.selectedIncident?.id)
          ? incidents.find((incident) => incident.id === state.selectedIncident?.id) || null
          : null,
    }));
  },

  setSelectedIncident: (incident) => set({ selectedIncident: incident }),

  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  resetFilters: () => set({ filters: initialFilters }),

  updateStatus: async (id, newStatus) => {
    const response = await apiClient.post<Incident>(`/incidents/${id}/status/`, { status: newStatus });
    const updated = response.data;
    set((state) => ({
      incidents: state.incidents.map((incident) => (incident.id === id ? updated : incident)),
      selectedIncident: state.selectedIncident?.id === id ? updated : state.selectedIncident,
    }));
    toast.success(`Incident status updated to ${newStatus}`);
  },

  assignUser: async (id, assignee) => {
    const response = await apiClient.post<Incident>(`/incidents/${id}/assign/`, {
      assigned_to_id: assignee?.id || null,
    });
    const updated = response.data;
    set((state) => ({
      incidents: state.incidents.map((incident) => (incident.id === id ? updated : incident)),
      selectedIncident: state.selectedIncident?.id === id ? updated : state.selectedIncident,
    }));
    toast.success(assignee ? `Assigned to ${assignee.full_name}` : 'Incident unassigned');
  },

  addComment: async (incidentId, message) => {
    const response = await apiClient.post<Comment>(`/incidents/${incidentId}/comments/`, { message });
    set((state) => ({
      commentsMap: {
        ...state.commentsMap,
        [incidentId]: [...(state.commentsMap[incidentId] || []), response.data],
      },
    }));
    toast.success('Comment added');
  },

  getFilteredIncidents: () => {
    const { incidents, filters } = get();
    return incidents.filter((incident) => {
      if (filters.severity !== 'ALL' && incident.severity !== filters.severity) return false;
      if (filters.status !== 'ALL' && incident.status !== filters.status) return false;
      if (filters.category !== 'ALL' && incident.category !== filters.category) return false;
      if (filters.assignedTo !== 'ALL' && incident.assigned_to?.id !== filters.assignedTo) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        if (
          !incident.title.toLowerCase().includes(query) &&
          !incident.description.toLowerCase().includes(query) &&
          !incident.id.toLowerCase().includes(query)
        ) return false;
      }
      return true;
    });
  },
}));
