import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar';
import { Navbar } from '../components/navigation/Navbar';
import { WorkspaceHeader } from '../components/navigation/WorkspaceHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const PageLoader: React.FC = () => {
  return (
    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center gap-3 text-zinc-400">
      <LoadingSpinner />
      <span className="text-xs font-mono tracking-wider uppercase">Loading SOC Workspace...</span>
    </div>
  );
};

export const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-zinc-100 flex overflow-x-hidden font-sans antialiased">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6"
        >
          <WorkspaceHeader environment="PROD" />
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
