import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../providers/ThemeProvider';
import { cn } from '../../utils/cn';

export interface ThemeToggleProps {
  className?: string;
  variant?: 'dropdown' | 'button';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, variant = 'dropdown' }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: {
    value: Theme;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { value: 'dark', label: 'Dark Mode', icon: Moon },
    { value: 'light', label: 'Light Mode', icon: Sun },
    { value: 'system', label: 'System Theme', icon: Monitor },
  ];

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors relative',
          className
        )}
        aria-label="Toggle theme"
        title={`Current theme: ${theme}. Click to toggle.`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {resolvedTheme === 'dark' ? (
            <motion.div
              key="dark"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
            </motion.div>
          ) : (
            <motion.div
              key="light"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sun className="w-4 h-4 text-amber-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors flex items-center justify-center',
          isOpen && 'bg-zinc-800 text-zinc-100',
          className
        )}
        aria-label="Toggle theme"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Select theme"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-indigo-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 mt-2 w-44 bg-surface-elevated border border-subtle rounded-xl shadow-xl py-1.5 z-50 text-zinc-100"
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-subtle mb-1">
              Theme Mode
            </div>
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors',
                    isSelected
                      ? 'bg-indigo-950/40 text-indigo-300'
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                  )}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        'w-3.5 h-3.5',
                        isSelected ? 'text-indigo-400' : 'text-zinc-400'
                      )}
                    />
                    <span>{option.label}</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeToggle;
