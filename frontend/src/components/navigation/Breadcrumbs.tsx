import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useBreadcrumbs, BreadcrumbItem } from '../../hooks/useBreadcrumbs';
import { cn } from '../../utils/cn';

export interface BreadcrumbsProps {
  customLabels?: Record<string, string>;
  className?: string;
  showHomeIcon?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  customLabels,
  className,
  showHomeIcon = true,
}) => {
  const items: BreadcrumbItem[] = useBreadcrumbs(customLabels);

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs font-medium', className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((item, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === items.length - 1;

          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {!isFirst && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-600 shrink-0"
                  aria-hidden="true"
                />
              )}
              {isLast ? (
                <span
                  className="text-zinc-100 dark:text-zinc-100 font-semibold truncate max-w-[180px] sm:max-w-[280px]"
                  aria-current="page"
                >
                  {isFirst && showHomeIcon ? (
                    <span className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="text-zinc-400 dark:text-zinc-400 hover:text-zinc-100 dark:hover:text-zinc-100 transition-colors flex items-center gap-1.5 truncate max-w-[140px] sm:max-w-[220px]"
                >
                  {isFirst && showHomeIcon ? <Home className="w-3.5 h-3.5 shrink-0" /> : null}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
