import { useAuthStore } from '../stores/auth.store';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, loadUser } = useAuthStore();
  return { user, isAuthenticated, isLoading, login, logout, loadUser };
}
