import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';

const SystemBootstrapStatus: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-8 rounded-2xl border border-cyan-500/20 space-y-4">
        <h1 className="text-2xl font-bold text-slate-100">Enterprise Platform Bootstrap Active</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          The enterprise environment has been successfully bootstrapped with Django REST Framework,
          Celery, Redis, React 18, React Query, and Docker infrastructure.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Frontend Stack
            </span>
            <p className="text-sm font-medium text-slate-200 mt-1">React, Vite, TS, Tailwind CSS</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Backend Architecture
            </span>
            <p className="text-sm font-medium text-slate-200 mt-1">Django 5, DRF, Celery, Redis</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              AI Infrastructure
            </span>
            <p className="text-sm font-medium text-slate-200 mt-1">LangGraph, LangChain, FAISS</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <SystemBootstrapStatus />,
      },
    ],
  },
]);

export const AppRoutes: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
