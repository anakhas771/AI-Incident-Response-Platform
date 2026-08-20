import React from 'react';

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton rounded-md ${className}`} />
);

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-5 animate-fade-up" aria-busy="true" aria-label="Loading dashboard">
      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Trend chart skeleton */}
        <div className="xl:col-span-8 rounded-xl border border-white/[0.06] bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-48" />
              <SkeletonBlock className="h-3 w-32" />
            </div>
            <SkeletonBlock className="h-7 w-28 rounded-lg" />
          </div>
          <SkeletonBlock className="h-52 w-full rounded-lg" />
        </div>

        {/* Donut chart skeleton */}
        <div className="xl:col-span-4 rounded-xl border border-white/[0.06] bg-surface p-5">
          <div className="space-y-2 mb-5">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-3 w-28" />
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="relative">
              <SkeletonBlock className="h-36 w-36 rounded-full" />
              <div className="absolute inset-6 rounded-full bg-surface" />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <SkeletonBlock className="h-2 w-2 rounded-full" />
                <SkeletonBlock className="h-3 flex-1" />
                <SkeletonBlock className="h-3 w-6" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incidents + AI feed row */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Incident feed skeleton */}
        <div className="xl:col-span-8 rounded-xl border border-white/[0.06] bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-44" />
              <SkeletonBlock className="h-3 w-32" />
            </div>
            <SkeletonBlock className="h-6 w-14 rounded-md" />
          </div>
          <div className="space-y-0 divide-y divide-white/[0.04]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3.5">
                <SkeletonBlock className="h-5 w-16 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <SkeletonBlock className="h-3.5 w-3/4" />
                  <SkeletonBlock className="h-3 w-1/2" />
                </div>
                <SkeletonBlock className="h-5 w-20 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* AI activity skeleton */}
        <div className="xl:col-span-4 rounded-xl border border-white/[0.06] bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
            <SkeletonBlock className="h-5 w-10 rounded" />
          </div>
          <div className="space-y-0 divide-y divide-white/[0.04]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="py-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <SkeletonBlock className="h-4 w-20 rounded" />
                  <SkeletonBlock className="h-3 w-28" />
                </div>
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
