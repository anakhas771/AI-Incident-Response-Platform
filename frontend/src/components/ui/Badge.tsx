import React from 'react';
import { Severity, Status, Role } from '../../types';
import { cn } from '../../utils/cn';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
  showDot?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  className,
  showDot = true,
  size = 'sm',
}) => {
  const styles: Record<Severity, string> = {
    CRITICAL: 'bg-red-950/80 text-red-400 border-red-800/60 font-semibold',
    HIGH: 'bg-orange-950/80 text-orange-400 border-orange-800/60 font-medium',
    MEDIUM: 'bg-amber-950/80 text-amber-400 border-amber-800/60 font-medium',
    LOW: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60 font-medium',
  };

  const dots: Record<Severity, string> = {
    CRITICAL: 'bg-red-500 critical-pulse',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-emerald-500',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[9px] gap-1',
    sm: 'px-2 py-0.5 text-[10px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border uppercase tracking-wider font-mono',
        sizes[size],
        styles[severity],
        className
      )}
    >
      {showDot && (
        <span className={cn('rounded-full shrink-0', dots[severity], size === 'xs' ? 'w-1 h-1' : 'w-1.5 h-1.5')} />
      )}
      {severity}
    </span>
  );
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = 'sm' }) => {
  const styles: Record<Status, string> = {
    OPEN: 'bg-blue-950/70 text-blue-400 border-blue-800/50',
    INVESTIGATING: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/50',
    IDENTIFIED: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/50',
    MITIGATING: 'bg-amber-950/70 text-amber-300 border-amber-800/50',
    RESOLVED: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/50',
    CLOSED: 'bg-zinc-900 text-zinc-500 border-zinc-800',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[9px]',
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-mono font-medium border uppercase tracking-wide',
        sizes[size],
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
  const styles: Record<Role, string> = {
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
