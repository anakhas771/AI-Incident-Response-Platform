import React from 'react';
import ErrorBoundary from '../components/common/ErrorBoundary';

export const ErrorBoundaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default ErrorBoundaryProvider;
