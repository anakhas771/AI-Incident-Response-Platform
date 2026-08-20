import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-cyan-400">
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-200">{title}</h3>

      <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-500">{description}</p>

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
