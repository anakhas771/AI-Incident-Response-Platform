export const ROUTES = {
  HOME: '/',
  INCIDENTS: '/incidents',
  INCIDENT_DETAIL: (id: string = ':id') => `/incidents/${id}`,
  AI_ASSISTANT: '/ai-assistant',
  KNOWLEDGE_BASE: '/knowledge',
  KNOWLEDGE_DETAIL: (id: string = ':id') => `/knowledge/${id}`,
  ANALYTICS: '/analytics',
  TIMELINE: '/timeline',
  ALERTS: '/alerts',
  ORGANIZATIONS: '/organizations',
  TEAM: '/team',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  ACTIVITY_LOG: '/activity-log',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  SPLASH: '/splash',
} as const;

export default ROUTES;
