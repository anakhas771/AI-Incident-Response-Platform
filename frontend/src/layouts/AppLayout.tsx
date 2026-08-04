import React from 'react';
import { Outlet } from 'react-router-dom';
import { CommandPalette } from '../components/navigation/CommandPalette';
import { KeyboardShortcutsModal } from '../components/navigation/KeyboardShortcutsModal';
import { CreateIncidentModal } from '../features/incidents/CreateIncidentModal';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export const AppLayout: React.FC = () => {
  // Register global keyboard shortcuts (Cmd+K, Cmd+B, '?', Escape, etc.)
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col font-sans antialiased overflow-x-hidden relative">
      {/* Skip to Main Content link for keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 z-50 px-4 py-2 bg-indigo-600 text-white font-medium text-xs rounded-lg shadow-lg"
      >
        Skip to main content
      </a>

      {/* Main Outlet for nested layouts (AuthLayout / DashboardLayout) */}
      <Outlet />

      {/* Global Modals */}
      <CommandPalette />
      <KeyboardShortcutsModal />
      <CreateIncidentModal />
    </div>
  );
};

export default AppLayout;
