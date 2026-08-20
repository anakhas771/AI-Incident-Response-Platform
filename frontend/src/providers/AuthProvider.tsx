/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { RegisterPayload } from '../api/authApi';
import { User, Organization } from '../types';

export interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchOrganization: (org: Organization) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    organization,
    token,
    isAuthenticated,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    restoreSession,
    switchOrganization: storeSwitchOrganization,
  } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(
    async (email: string, pass: string) => {
      return storeLogin(email, pass);
    },
    [storeLogin]
  );

  const register = useCallback(
    async (data: RegisterPayload) => {
      return storeRegister(data);
    },
    [storeRegister]
  );

  const logout = useCallback(() => {
    storeLogout();
  }, [storeLogout]);

  const switchOrganization = useCallback(
    (org: Organization) => {
      storeSwitchOrganization(org);
    },
    [storeSwitchOrganization]
  );

  const value = useMemo(
    () => ({
      user,
      organization,
      token,
      isAuthenticated,
      login,
      register,
      logout,
      switchOrganization,
    }),
    [user, organization, token, isAuthenticated, login, register, logout, switchOrganization]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
