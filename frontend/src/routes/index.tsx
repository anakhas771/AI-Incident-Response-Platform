import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import SplashPage from '../pages/SplashPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import DashboardPage from '../pages/DashboardPage';
import IncidentsPage from '../pages/IncidentsPage';
import IncidentDetailPage from '../pages/IncidentDetailPage';
import AIAssistantPage from '../pages/AIAssistantPage';
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage';
import { KnowledgeDetailPage } from '../pages/KnowledgeDetailPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import TimelinePage from '../pages/TimelinePage';
import AlertsPage from '../pages/AlertsPage';
import OrganizationsPage from '../pages/OrganizationsPage';
import TeamPage from '../pages/TeamPage';
import SettingsPage from '../pages/SettingsPage';
import ProfilePage from '../pages/ProfilePage';
import ActivityLogPage from '../pages/ActivityLogPage';
import NotFoundPage from '../pages/NotFoundPage';

const router = createBrowserRouter([
  {
    path: '/splash',
    element: <SplashPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
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
]);

export const AppRoutes: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
