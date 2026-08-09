import { create } from 'zustand';
import { Organization, User } from '../types';
import { authApi, RegisterPayload } from '../api/authApi';
import { AxiosError } from 'axios';

export interface RegisterResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | string>;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthState {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<LoginResult>;
  register: (data: RegisterPayload) => Promise<RegisterResult>;
  logout: () => void;
  restoreSession: () => Promise<boolean>;
  switchOrganization: (org: Organization) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  organization: null,
  token: localStorage.getItem('access'),
  isAuthenticated: Boolean(localStorage.getItem('access')),
  isLoading: true,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);

      set({
        user: data.user,
        organization: data.user.organization || null,
        token: data.access,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    } catch (err: unknown) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');

      set({
        user: null,
        organization: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      let errorMessage = 'Invalid email or password';
      if (err instanceof AxiosError && err.response?.data) {
        const respData = err.response.data;
        if (respData.detail) {
          errorMessage = respData.detail;
        } else if (respData.non_field_errors && Array.isArray(respData.non_field_errors)) {
          errorMessage = respData.non_field_errors[0];
        } else if (respData.error) {
          errorMessage =
            typeof respData.error === 'string' ? respData.error : respData.error.message || errorMessage;
        }
      }

      return { success: false, error: errorMessage };
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      await authApi.register(data);
      set({ isLoading: false });
      return { success: true };
    } catch (err: unknown) {
      set({ isLoading: false });
      let errorMessage = 'Registration failed. Please check your information.';
      let fieldErrors: Record<string, string[] | string> = {};

      if (err instanceof AxiosError && err.response?.data) {
        const respData = err.response.data;
        if (typeof respData === 'object' && respData !== null) {
          fieldErrors = respData as Record<string, string[] | string>;
          const primaryField =
            fieldErrors.non_field_errors ||
            fieldErrors.email ||
            fieldErrors.password_confirm ||
            fieldErrors.password ||
            fieldErrors.first_name ||
            fieldErrors.last_name ||
            fieldErrors.role;
          if (primaryField) {
            errorMessage = Array.isArray(primaryField) ? primaryField.join(' ') : String(primaryField);
          } else if (respData.detail) {
            errorMessage = String(respData.detail);
          }
        }
      }

      return { success: false, error: errorMessage, fieldErrors };
    }
  },

  logout: () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    set({
      user: null,
      organization: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  restoreSession: async () => {
    const access = localStorage.getItem('access');
    const refresh = localStorage.getItem('refresh');

    if (!access) {
      set({ user: null, organization: null, token: null, isAuthenticated: false, isLoading: false });
      return false;
    }

    try {
      const user = await authApi.getProfile();
      set({
        user,
        organization: user.organization || null,
        token: access,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch {
      // Try refresh
      if (refresh && !refresh.startsWith('mock-')) {
        try {
          const refreshResp = await authApi.refreshToken(refresh);
          localStorage.setItem('access', refreshResp.access);
          const user = await authApi.getProfile();
          set({
            user,
            organization: user.organization || null,
            token: refreshResp.access,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch {
          get().logout();
          return false;
        }
      } else {
        get().logout();
        return false;
      }
    }
  },

  switchOrganization: (org) => {
    set({ organization: org });
  },
}));

export default useAuthStore;