import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrent: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  '': 'Platform',
  incidents: 'Incidents',
  'ai-assistant': 'AI Copilot',
  knowledge: 'Knowledge Base',
  analytics: 'Analytics',
  timeline: 'Timeline',
  alerts: 'Alerts Queue',
  organizations: 'Organizations',
  team: 'Team Members',
  settings: 'Settings',
  profile: 'Operator Profile',
  'activity-log': 'Activity Log',
};

export function useBreadcrumbs(customLabels?: Record<string, string>): BreadcrumbItem[] {
  const location = useLocation();

  return useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const combinedLabels = { ...ROUTE_LABELS, ...customLabels };

    const items: BreadcrumbItem[] = [
      {
        label: combinedLabels[''] || 'Platform',
        path: '/',
        isCurrent: pathSegments.length === 0,
      },
    ];

    pathSegments.forEach((segment, index) => {
      const url = '/' + pathSegments.slice(0, index + 1).join('/');
      const isCurrent = index === pathSegments.length - 1;

      // Handle ID or dynamic segments
      let label = combinedLabels[segment];
      if (!label) {
        // If it looks like an ID, format it nicely
        if (segment.startsWith('inc-') || segment.startsWith('kb-') || segment.length > 16) {
          label = segment.toUpperCase();
        } else {
          label = segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
        }
      }

      items.push({
        label,
        path: url,
        isCurrent,
      });
    });

    return items;
  }, [location.pathname, customLabels]);
}

export default useBreadcrumbs;
