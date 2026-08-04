import React from 'react';
import { ErrorBoundaryProvider } from './ErrorBoundaryProvider';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider, Theme } from './ThemeProvider';
import { AuthProvider } from './AuthProvider';
import { ToastProvider } from './ToastProvider';

export interface AppProvidersProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children, defaultTheme = 'dark' }) => {
  return (
    <ErrorBoundaryProvider>
      <QueryProvider>
        <ThemeProvider defaultTheme={defaultTheme}>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundaryProvider>
  );
};

export default AppProviders;
