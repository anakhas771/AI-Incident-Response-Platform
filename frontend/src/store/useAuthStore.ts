import { create } from 'zustand';
import { Organization, Role, User } from '../types';
import { mockOrganization, mockUsers } from '../services/mockData';

export interface RegisterPayload {
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  role?: Role;
}

interface AuthState {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (data: RegisterPayload) => Promise<boolean>;
  logout: () => void;
  switchOrganization: (org: Organization) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: mockUsers[0],
  organization: mockOrganization,
  token: 'mock-jwt-bearer-token-2026',
  isAuthenticated: true,

  login: async (email, _pass) => {
    const found =
      mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || mockUsers[0];
    set({
      user: found,
      organization: found.organization || mockOrganization,
      token: 'mock-jwt-bearer-token-' + Date.now(),
      isAuthenticated: true,
    });
    return true;
  },

  register: async (data) => {
    const newUser: User = {
      id: 'user-' + Date.now(),
      email: data.email,
      first_name: data.first_name || 'New',
      last_name: data.last_name || 'User',
      full_name: `${data.first_name || 'New'} ${data.last_name || 'User'}`,
      role: data.role || 'ANALYST',
      organization: mockOrganization,
      is_active: true,
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
    set({
      user: newUser,
      organization: mockOrganization,
      token: 'mock-jwt-bearer-token-' + Date.now(),
      isAuthenticated: true,
    });
    return true;
  },

  logout: () => {
    set({ user: null, organization: null, token: null, isAuthenticated: false });
  },

  switchOrganization: (org) => {
    set({ organization: org });
  },
}));
