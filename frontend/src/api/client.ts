import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export interface ApiErrorResponse {
  error?: { code?: string; message?: string; details?: unknown };
  detail?: string;
  [key: string]: unknown;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers['X-Client-Request-Time'] = new Date().toISOString();

    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const token = useAuthStore.getState().token || localStorage.getItem('access');
    if (token && !token.startsWith('mock-') && !token.includes('mock-jwt')) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as CustomRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login/') &&
      !originalRequest.url?.includes('/auth/register/') &&
      !originalRequest.url?.includes('/auth/refresh/')
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh');

      if (refreshToken && !refreshToken.startsWith('mock-')) {
        try {
          const refreshResponse = await axios.post<{ access: string }>(
            `${BASE_URL.replace(/\/+$/, '')}/auth/refresh/`,
            { refresh: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );
          const newAccess = refreshResponse.data.access;
          localStorage.setItem('access', newAccess);
          useAuthStore.setState({ token: newAccess, isAuthenticated: true });
          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          useAuthStore.getState().logout();
          return Promise.reject(refreshErr);
        }
      } else {
        useAuthStore.getState().logout();
      }
    }

    if (error.response) {
      const status = error.response.status;
      const apiError = error.response.data;
      console.error(`[API Error ${status}]:`, apiError?.detail || apiError?.error || error.message);
    } else if (error.request) {
      console.error('[API Network Error]: No response received from server.');
    } else {
      console.error('[API Request Config Error]:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
