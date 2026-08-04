import React from 'react';
import { Card } from '../../../components/ui/Card';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div
      className="space-y-6 animate-pulse"
      role="status"
      aria-label="Loading Enterprise Dashboard"
    >
      {/* KPI Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, idx) => (
          <Card key={idx} hoverEffect={false} className="h-28 flex flex-col justify-between p-4">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-zinc-800 rounded" />
              <div className="h-8 w-8 bg-zinc-800 rounded-lg" />
            </div>
            <div className="flex justify-between items-baseline mt-3">
              <div className="h-7 w-16 bg-zinc-800 rounded" />
              <div className="h-3 w-12 bg-zinc-800 rounded" />
            </div>
            <div className="h-2.5 w-24 bg-zinc-800/60 rounded mt-1" />
          </Card>
        ))}
      </div>

      {/* Charts Skeleton Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card hoverEffect={false} className="h-96 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 w-44 bg-zinc-800 rounded" />
                <div className="h-3 w-32 bg-zinc-800/60 rounded" />
              </div>
              <div className="h-3 w-16 bg-zinc-800 rounded" />
            </div>
            <div className="h-64 w-full bg-zinc-800/40 rounded-xl" />
          </Card>
        </div>

        <div>
          <Card hoverEffect={false} className="h-96 p-6 space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-36 bg-zinc-800 rounded" />
              <div className="h-3 w-24 bg-zinc-800/60 rounded" />
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="h-40 w-40 rounded-full bg-zinc-800/60 border-8 border-zinc-800" />
            </div>
          </Card>
        </div>
      </div>

      {/* Feeds Skeleton Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card hoverEffect={false} className="h-80 p-6 space-y-4">
          <div className="h-4 w-40 bg-zinc-800 rounded" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 w-full bg-zinc-800/40 rounded-lg" />
            ))}
          </div>
        </Card>

        <Card hoverEffect={false} className="h-80 p-6 space-y-4">
          <div className="h-4 w-40 bg-zinc-800 rounded" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 w-full bg-zinc-800/40 rounded-lg" />
            ))}
          </div>
        </Card>

        <Card hoverEffect={false} className="h-80 p-6 space-y-4">
          <div className="h-4 w-40 bg-zinc-800 rounded" />
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 w-full bg-zinc-800/40 rounded" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
