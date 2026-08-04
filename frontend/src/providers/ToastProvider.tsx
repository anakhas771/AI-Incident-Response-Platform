import React from 'react';
import { Toaster } from 'react-hot-toast';

export const ToastProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          className: 'text-xs font-medium',
          style: {
            background: '#18181b',
            color: '#f4f4f5',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
            borderRadius: '0.75rem',
            padding: '12px 16px',
            maxWidth: '420px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#18181b',
            },
            style: {
              borderLeft: '4px solid #10b981',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e',
              secondary: '#18181b',
            },
            style: {
              borderLeft: '4px solid #f43f5e',
            },
          },
          loading: {
            iconTheme: {
              primary: '#6366f1',
              secondary: '#18181b',
            },
          },
        }}
      />
    </>
  );
};

export default ToastProvider;
