import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from '../components/navigation/Sidebar';
import { Navbar } from '../components/navigation/Navbar';
import { CommandPalette } from '../components/navigation/CommandPalette';
import { KeyboardShortcutsModal } from '../components/navigation/KeyboardShortcutsModal';
import { CreateIncidentModal } from '../features/incidents/CreateIncidentModal';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-zinc-100 flex overflow-x-hidden font-sans antialiased">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>

      {/* Modals & Toast Container */}
      <CommandPalette />
      <KeyboardShortcutsModal />
      <CreateIncidentModal />
      <Toaster position="bottom-right" />
    </div>
  );
};

export default AppLayout;
