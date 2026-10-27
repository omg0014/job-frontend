import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { FullPageSpinner } from './Loading.jsx';
import { ROLES, isStaff, atLeast } from '../lib/roles.js';

/**
 * Route guard. This is a convenience for the user, not a security boundary —
 * every admin endpoint is role-checked on the server as well.
 */
export const ProtectedRoute = ({ role, minRole, staffOnly, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  if (!user) {
    // Remember where they were headed so login can return them there.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const home = isStaff(user.role) ? '/admin' : '/dashboard';

  // `staffOnly` covers admin/principal/recruiter; `minRole` gates a rung of
  // the hierarchy; `role` still pins one exact role (candidate areas).
  if (staffOnly && !isStaff(user.role)) return <Navigate to={home} replace />;
  if (minRole && !atLeast(user.role, minRole)) return <Navigate to={home} replace />;
  if (role && user.role !== role) return <Navigate to={home} replace />;

  return children;
};
