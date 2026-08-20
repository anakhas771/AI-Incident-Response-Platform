import { useAuthStore } from '../stores/useAuthStore';
export type Role = 'ADMIN' | 'RESPONDER' | 'ANALYST' | 'VIEWER';

export const usePermissions = () => {
  const { user } = useAuthStore();
  const role = user?.role as Role | undefined;

  return {
    isAdmin: role === 'ADMIN',
    isResponder: role === 'ADMIN' || role === 'RESPONDER',
    isAnalyst: role === 'ADMIN' || role === 'RESPONDER' || role === 'ANALYST',

    canManageUsers: role === 'ADMIN' || role === 'RESPONDER',
    canManageOrganization: role === 'ADMIN' || role === 'RESPONDER',
    canDeleteIncidents: role === 'ADMIN' || role === 'RESPONDER',
    canManageKnowledge: role === 'ADMIN' || role === 'RESPONDER',
    canTriggerAI: role === 'ADMIN' || role === 'RESPONDER' || role === 'ANALYST',
    canUpdateIncidents: role === 'ADMIN' || role === 'RESPONDER' || role === 'ANALYST',
    canComment: role === 'ADMIN' || role === 'RESPONDER' || role === 'ANALYST' || role === 'VIEWER',
  };
};
