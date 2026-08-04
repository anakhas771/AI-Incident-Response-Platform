import React, { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute, PublicRoute } from './guards';

// Lazy load all page components for code splitting & optimal performance
const SplashPage = lazy(() => import('../pages/SplashPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const IncidentsPage = lazy(() => import('../pages/IncidentsPage'));
const IncidentDetailPage = lazy(() => import('../pages/IncidentDetailPage'));
const AIAssistantPage = lazy(() => import('../pages/AIAssistantPage'));
const KnowledgeBasePage = lazy(() =>
  import('../pages/KnowledgeBasePage').then((module) => ({ default: module.KnowledgeBasePage }))
);
const KnowledgeDetailPage = lazy(() =>
  import('../pages/KnowledgeDetailPage').then((module) => ({ default: module.KnowledgeDetailPage }))
);
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const TimelinePage = lazy(() => import('../pages/TimelinePage'));
const AlertsPage = lazy(() => import('../pages/AlertsPage'));
const OrganizationsPage = lazy(() => import('../pages/OrganizationsPage'));
const TeamPage = lazy(() => import('../pages/TeamPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const ActivityLogPage = lazy(() => import('../pages/ActivityLogPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // Public / Auth Routes
      {
        element: (
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        ),
        children: [
          {
            path: 'login',
            element: <LoginPage />,
          },
          {
            path: 'register',
            element: <RegisterPage />,
          },
          {
            path: 'forgot-password',
            element: <ForgotPasswordPage />,
          },
          {
            path: 'splash',
            element: <SplashPage />,
          },
        ],
      },
      // Private / Authenticated Workspace Routes
      {
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'incidents',
            element: <IncidentsPage />,
          },
          {
            path: 'incidents/:id',
            element: <IncidentDetailPage />,
          },
          {
            path: 'ai-assistant',
            element: <AIAssistantPage />,
          },
          {
            path: 'knowledge',
            element: <KnowledgeBasePage />,
          },
          {
            path: 'knowledge/:id',
            element: <KnowledgeDetailPage />,
          },
          {
            path: 'analytics',
            element: <AnalyticsPage />,
          },
          {
            path: 'timeline',
            element: <TimelinePage />,
          },
          {
            path: 'alerts',
            element: <AlertsPage />,
          },
          {
            path: 'organizations',
            element: <OrganizationsPage />,
          },
          {
            path: 'team',
            element: <TeamPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            path: 'activity-log',
            element: <ActivityLogPage />,
          },
          {
            path: '*',
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
]);

export const AppRoutes: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
