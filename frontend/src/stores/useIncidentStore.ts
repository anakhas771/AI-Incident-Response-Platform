import { create } from 'zustand';
import { Category, Comment, Incident, Severity, Status, User } from '../types';
import { mockIncidents, mockUsers } from '../services/mockData';
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
  setSelectedIncident: (incident: Incident | null) => void;
  setFilters: (filters: Partial<IncidentFilterState>) => void;
  resetFilters: () => void;
  addIncident: (data: Partial<Incident>, user: User) => Incident;
  updateStatus: (id: string, newStatus: Status, user: User) => void;
  assignUser: (id: string, assignee: User | null, user: User) => void;
  addComment: (incidentId: string, message: string, author: User) => void;
  getFilteredIncidents: () => Incident[];
}

const initialFilters: IncidentFilterState = {
  severity: 'ALL',
  status: 'ALL',
  category: 'ALL',
  search: '',
  assignedTo: 'ALL',
};

const initialComments: Record<string, Comment[]> = {
  'inc-9081-01': [
    {
      id: 'c-001',
      incident_id: 'inc-9081-01',
      author: mockUsers[1],
      message: 'Initial triage complete. Kubernetes HPA pods spinning up to absorb initial burst.',
      created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: 'c-002',
      incident_id: 'inc-9081-01',
      author: mockUsers[0],
      message: 'Cloudflare WAF rate limiting rule #4092 applied. Monitoring ingress telemetry.',
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
  ],
};

export const useIncidentStore = create<IncidentState>((set, get) => ({
  incidents: mockIncidents,
  selectedIncident: mockIncidents[0],
  filters: initialFilters,
  commentsMap: initialComments,

  setSelectedIncident: (incident) => set({ selectedIncident: incident }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: initialFilters }),

  addIncident: (data, user) => {
    const newInc: Incident = {
      id: `inc-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`,
      title: data.title || 'Untitled Security Anomaly',
      description: data.description || '',
      severity: data.severity || 'MEDIUM',
      status: 'OPEN',
      category: data.category || 'Security',
      created_by: user,
      assigned_to: data.assigned_to || null,
      organization: user.organization,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: null,
      closed_at: null,
      comments_count: 0,
      attachments_count: 0,
      ai_summary: {
        risk_score: data.severity === 'CRITICAL' ? 95 : data.severity === 'HIGH' ? 82 : 55,
        confidence: 89,
        predicted_severity: data.severity || 'MEDIUM',
        summary: `AI Security Engine analyzing payload for ${data.title}. Initial automated scan complete.`,
        root_cause_hypothesis: 'Under investigation by automated diagnostic subagent.',
        recommended_actions: [
          'Isolate affected service containers',
          'Review audit logs for anomalous IAM tokens',
          'Verify TLS certificate chain',
        ],
        similar_incidents: [],
      },
    };

    set((state) => ({
      incidents: [newInc, ...state.incidents],
      selectedIncident: newInc,
    }));

    toast.success(`Incident ${newInc.id} created successfully!`, {
      style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
      iconTheme: { primary: '#10b981', secondary: '#18181b' },
    });

    return newInc;
  },

  updateStatus: (id, newStatus, _user) => {
    set((state) => {
      const updatedList = state.incidents.map((inc) => {
        if (inc.id === id) {
          const now = new Date().toISOString();
          const isRes = newStatus === 'RESOLVED';
          const isClosed = newStatus === 'CLOSED';
          return {
            ...inc,
            status: newStatus,
            updated_at: now,
            resolved_at: isRes ? now : inc.resolved_at,
            closed_at: isClosed ? now : inc.closed_at,
          };
        }
        return inc;
      });
      const updatedSelected =
        state.selectedIncident?.id === id
          ? updatedList.find((i) => i.id === id) || null
          : state.selectedIncident;
      return { incidents: updatedList, selectedIncident: updatedSelected };
    });

    toast.success(`Incident status updated to ${newStatus}`, {
      style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
    });
  },

  assignUser: (id, assignee, _user) => {
    set((state) => {
      const updatedList = state.incidents.map((inc) =>
        inc.id === id
          ? { ...inc, assigned_to: assignee, updated_at: new Date().toISOString() }
          : inc
      );
      const updatedSelected =
        state.selectedIncident?.id === id
          ? updatedList.find((i) => i.id === id) || null
          : state.selectedIncident;
      return { incidents: updatedList, selectedIncident: updatedSelected };
    });

    toast.success(assignee ? `Assigned to ${assignee.full_name}` : 'Unassigned incident', {
      style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
    });
  },

  addComment: (incidentId, message, author) => {
    const newComment: Comment = {
      id: 'c-' + Date.now(),
      incident_id: incidentId,
      author,
      message,
      created_at: new Date().toISOString(),
    };

    set((state) => {
      const existing = state.commentsMap[incidentId] || [];
      const updatedCommentsMap = {
        ...state.commentsMap,
        [incidentId]: [...existing, newComment],
      };
      const updatedIncidents = state.incidents.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              comments_count: (inc.comments_count || 0) + 1,
              updated_at: new Date().toISOString(),
            }
          : inc
      );
      const updatedSelected =
        state.selectedIncident?.id === incidentId
          ? updatedIncidents.find((i) => i.id === incidentId) || null
          : state.selectedIncident;

      return {
        commentsMap: updatedCommentsMap,
        incidents: updatedIncidents,
        selectedIncident: updatedSelected,
      };
    });

    toast.success('Comment added', {
      style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
    });
  },

  getFilteredIncidents: () => {
    const { incidents, filters } = get();
    return incidents.filter((inc) => {
      if (filters.severity !== 'ALL' && inc.severity !== filters.severity) return false;
      if (filters.status !== 'ALL' && inc.status !== filters.status) return false;
      if (filters.category !== 'ALL' && inc.category !== filters.category) return false;
      if (filters.assignedTo !== 'ALL' && inc.assigned_to?.id !== filters.assignedTo) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchTitle = inc.title.toLowerCase().includes(query);
        const matchDesc = inc.description.toLowerCase().includes(query);
        const matchId = inc.id.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchId) return false;
      }
      return true;
    });
  },
}));
