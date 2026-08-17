import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar';
import { Navbar } from '../components/navigation/Navbar';
import { WorkspaceHeader } from '../components/navigation/WorkspaceHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const PageLoader: React.FC = () => {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 text-zinc-400">
      <LoadingSpinner />
      <span className="text-xs font-mono uppercase tracking-wider">Loading SOC Workspace...</span>
    </div>
  );
};

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const isCopilotPage = location.pathname === '/ai-assistant';

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans antialiased text-zinc-100">
      <div className="hidden h-full shrink-0 lg:block">
        <Sidebar />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Navbar />

        <main
          id="main-content"
          className={
            isCopilotPage
              ? 'min-h-0 flex-1 overflow-hidden'
              : 'min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8'
          }
        >
          {!isCopilotPage && <WorkspaceHeader environment="PROD" />}

          <div
            className={
              isCopilotPage
                ? 'h-full min-h-0 w-full'
                : 'mx-auto w-full max-w-7xl space-y-6'
            }
          >
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
