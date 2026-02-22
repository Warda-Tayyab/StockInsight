import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import Loading from '@/components/comman/Loading';

/**
 * Root path "/" – Pehle login page dikhao, logged in ho to dashboard.
 * First show login; after login, show dashboard.
 */
export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  // Not logged in → pehle login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in → dashboard
  return <Navigate to="/dashboard" replace />;
}
