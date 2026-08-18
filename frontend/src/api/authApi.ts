import apiClient from './client';
import { Organization, User, Role } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  organization_name?: string;
  organization_id?: string;
  role?: Role;
  phone_number?: string;
  invitation_token?: string;
}

export interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

export interface InvitationPreview {
  email: string;
  organization_name: string;
  role: Role;
  expires_at: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login/', payload);
    return response.data;
  },

  register: async (payload: RegisterPayload): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register/', payload);
    return response.data;
  },

  refreshToken: async (refresh: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh/', { refresh });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me/');
    return response.data;
  },

  updateProfile: async (payload: FormData | Partial<User>): Promise<User> => {
    const response = await apiClient.patch<User>('/auth/me/', payload);
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>('/auth/password-reset/', { email });
    return response.data;
  },

  confirmPasswordReset: async (payload: {
    token: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>(
      '/auth/password-reset/confirm/',
      payload
    );
    return response.data;
  },

  previewInvitation: async (token: string): Promise<InvitationPreview> => {
    const response = await apiClient.get<InvitationPreview>('/auth/invitations/preview/', {
      params: { token },
    });
    return response.data;
  },

  acceptInvitation: async (token: string): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>('/auth/invitations/accept/', {
      token,
    });
    return response.data;
  },

  sendInvitation: async (payload: { email: string; role: Role }): Promise<unknown> => {
    const response = await apiClient.post('/auth/invitations/', payload);
    return response.data;
  },

  createOrganization: async (payload: {
    name: string;
    description?: string;
  }): Promise<Organization> => {
    const response = await apiClient.post<Organization>('/auth/organizations/', payload);
    return response.data;
  },
};

export default authApi;
