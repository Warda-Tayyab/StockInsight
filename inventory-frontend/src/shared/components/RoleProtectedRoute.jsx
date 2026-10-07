import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { hasFullAccess } from '../utils/roles';

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useAuthContext();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = user?.role ?? '';
    if (!allowedRoles.includes(role)) {
      const fallback = hasFullAccess(role) ? '/dashboard' : '/pos';
      return <Navigate to={fallback} replace />;
    }
  }

  return children;
};

export default RoleProtectedRoute;
