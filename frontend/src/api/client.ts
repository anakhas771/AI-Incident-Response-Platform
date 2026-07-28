import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// API Response Wrappers
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details: unknown;
  };
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor (Inject correlation ID and placeholder Auth headers)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Generate/Attach request ID tracing
    config.headers['X-Client-Request-Time'] = new Date().toISOString();
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor (Standardized error processing)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const status = error.response.status;
      const apiError = error.response.data?.error;
      
      console.error(`[API Error ${status}]:`, apiError?.message || error.message);
    } else if (error.request) {
      console.error('[API Network Error]: No response received from server.');
    } else {
      console.error('[API Request Config Error]:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
