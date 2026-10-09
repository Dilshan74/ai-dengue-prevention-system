import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loader from "../components/common/Loader";
import useAuth from "../hooks/useAuth";

/**
 * Guard a route group. `allow` lists the roles permitted to enter; anyone else
 * is redirected to /login (unauthenticated) or /unauthorized (wrong role).
 */
export default function ProtectedRoute({ allow = [] }) {
  const { isAuthenticated, role, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullscreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const currentRole = (role || user?.role || "citizen").toLowerCase();
  const normalizedAllow = allow.map((r) => String(r).toLowerCase());

  if (normalizedAllow.length && !normalizedAllow.includes(currentRole)) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{
          from: location.pathname,
          currentRole,
          userName: user?.name,
          requiredRoles: allow,
        }}
      />
    );
  }

  return <Outlet />;
}
