import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Badge, Card, PageSpinner } from "./ui";

export const ROLE_HIERARCHY = {
  user: 0,
  member: 0,
  moderator: 1,
  admin: 2,
  super_admin: 3,
  superadmin: 3,
};

/**
 * Returns the default dashboard URL for a given role based on the architectural specification.
 */
export function getDashboardForRole(role) {
  const normalized = String(role || "member").toLowerCase().replace("-", "_");
  switch (normalized) {
    case "superadmin":
    case "super_admin":
      return "/super-admin/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "moderator":
      return "/moderator/dashboard";
    case "user":
    case "member":
    default:
      return "/dashboard";
  }
}

/**
 * Verifies whether a user has the required permission level or belongs to the allowed roles.
 */
export function checkRoleAuthorized(userRole, { allowedRoles = [], minRole = null } = {}) {
  const normalizedUserRole = String(userRole || "member").toLowerCase().replace("-", "_");
  const userLevel = ROLE_HIERARCHY[normalizedUserRole] ?? 0;

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map((r) => String(r).toLowerCase().replace("-", "_"));
    return normalizedAllowed.includes(normalizedUserRole);
  }

  if (minRole) {
    const normalizedMin = String(minRole).toLowerCase().replace("-", "_");
    const minLevel = ROLE_HIERARCHY[normalizedMin] ?? 0;
    return userLevel >= minLevel;
  }

  return true;
}

/**
 * General ProtectedRoute: ensures any authenticated user can view the route.
 */
export function ProtectedRoute({ children, fallback = "/login" }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-base-200">
        <PageSpinner label="Verifying session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallback} replace state={{ from: location.pathname }} />;
  }

  return children || <Outlet />;
}

/**
 * Role-Based Route Protection: strictly gates routes based on role.
 * USER cannot access Admin or Moderator routes.
 * MODERATOR cannot access Admin or Super Admin routes.
 * ADMIN cannot access Super Admin routes.
 * SUPER_ADMIN has platform-wide access.
 */
export function RoleProtectedRoute({
  children,
  allowedRoles = [],
  minRole = null,
  fallback = "/login",
}) {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-base-200">
        <PageSpinner label="Verifying permissions..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallback} replace state={{ from: location.pathname }} />;
  }

  const isAuthorized = checkRoleAuthorized(user.role, { allowedRoles, minRole });

  if (!isAuthorized) {
    const roleDashboard = getDashboardForRole(user.role);
    return (
      <div className="min-h-dvh flex items-center justify-center bg-base-200 p-4">
        <Card className="max-w-md w-full text-center space-y-4 shadow-xl border-rose-500/20">
          <Badge tone="danger">Access Denied (403)</Badge>
          <h1 className="text-xl font-bold text-base-content">Unauthorized Role</h1>
          <p className="text-xs hl-muted-text leading-relaxed">
            Your account role (<span className="font-semibold capitalize text-base-content">{user.role}</span>) does not hold authorization to access this area.
          </p>
          <div className="pt-2">
            <Navigate to={roleDashboard} replace />
          </div>
        </Card>
      </div>
    );
  }

  return children || <Outlet />;
}

/**
 * AuthRedirect: Redirects authenticated users to their respective role dashboard.
 * If not authenticated, renders the requested auth component (LoginPage or SignupPage).
 */
export function AuthRedirect({ mode = "login", component: Component }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-base-200">
        <PageSpinner label="Getting HeartLink ready..." />
      </div>
    );
  }

  if (user) {
    const defaultDashboard = getDashboardForRole(user.role);
    const target = location.state?.from && !location.state.from.includes("/login")
      ? location.state.from
      : defaultDashboard;
    return <Navigate to={target} replace />;
  }

  return Component ? <Component mode={mode} /> : null;
}
