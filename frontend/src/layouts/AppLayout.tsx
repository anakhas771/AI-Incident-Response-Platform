import React from 'react';
import { Outlet } from 'react-router-dom';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Shell */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
            SRE
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400">
            AI Incident Response Platform
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>System Ready</span>
          </span>
        </div>
      </header>

      {/* Main Content Area Slot */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Enterprise Footer */}
      <footer className="py-4 px-6 border-t border-slate-800/60 text-center text-xs text-slate-500">
        AI Incident Response Platform &bull; Scalable Enterprise Bootstrap
      </footer>
    </div>
  );
};

export default AppLayout;
