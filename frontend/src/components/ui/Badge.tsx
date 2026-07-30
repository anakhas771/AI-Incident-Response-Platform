import React from 'react';
import { Severity, Status, Role } from '../../types';
import { cn } from '../../utils/cn';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
  showDot?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className, showDot = true }) => {
  const styles = {
    CRITICAL: 'bg-red-950/80 text-red-400 border-red-800/60 font-semibold',
    HIGH: 'bg-orange-950/80 text-orange-400 border-orange-800/60 font-medium',
    MEDIUM: 'bg-amber-950/80 text-amber-400 border-amber-800/60 font-medium',
    LOW: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60 font-medium',
  };

  const dots = {
    CRITICAL: 'bg-red-500 critical-pulse',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-emerald-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border uppercase tracking-wider',
        styles[severity],
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', dots[severity])} />}
      {severity}
    </span>
  );
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const styles = {
    OPEN: 'bg-blue-950/70 text-blue-400 border-blue-800/50',
    INVESTIGATING: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/50',
    IDENTIFIED: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/50',
    MITIGATING: 'bg-amber-950/70 text-amber-300 border-amber-800/50',
    RESOLVED: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/50',
    CLOSED: 'bg-zinc-900 text-zinc-400 border-zinc-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium border uppercase tracking-wide',
        styles[status],
        className
      )}
    >
      {status}
    </span>
  );
};

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
  const styles = {
    ADMIN: 'bg-purple-950/60 text-purple-300 border-purple-800/40',
    ANALYST: 'bg-blue-950/60 text-blue-300 border-blue-800/40',
    RESPONDER: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
    VIEWER: 'bg-zinc-900 text-zinc-400 border-zinc-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold border tracking-wider',
        styles[role],
        className
      )}
    >
      {role}
    </span>
  );
};
