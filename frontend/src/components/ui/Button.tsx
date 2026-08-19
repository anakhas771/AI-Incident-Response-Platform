import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'ai';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none cursor-pointer';

    const variants = {
      default: 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-semibold shadow-sm',
      secondary:
        'bg-white/[0.06] text-zinc-100 hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/[0.14]',
      outline:
        'bg-transparent text-zinc-200 hover:bg-white/[0.05] border border-white/[0.1] hover:border-white/[0.18]',
      ghost: 'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]',
      destructive:
        'bg-red-900/40 text-red-200 border border-red-800/60 hover:bg-red-900/60 hover:border-red-700/60',
      ai: 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 border border-indigo-400/20 hover:brightness-110',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-11 px-6 text-base gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
