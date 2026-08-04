import { useAuthContext, AuthContextType } from '../providers/AuthProvider';

export function useAuth(): AuthContextType {
  return useAuthContext();
}

export default useAuth;
