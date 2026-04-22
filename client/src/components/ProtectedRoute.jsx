import { useAuth } from "../context/AuthContext";
import { usePermission } from "../context/PermissionContext";

/**
 * ✅ Permission-Based Protected Route
 * Only renders children if user has permission to that module
 */
export function ProtectedRoute({ children, module, action = "view", fallback }) {
  const { user, loading } = useAuth();
  const { hasPermission } = usePermission();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-lg text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center font-black text-xl text-gray-300 uppercase tracking-widest bg-white">
        Please log in first
      </div>
    );
  }

  if (!hasPermission(module, action)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center font-black text-xl text-gray-300 uppercase tracking-widest bg-white">
        Unauthorized Access
      </div>
    );
  }

  return children;
}

/**
 * ✅ Role-Based Protected Route (Legacy System)
 * Only renders children if user has specific roles
 */
export function RoleProtectedRoute({ children, roles = [], fallback }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-lg text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center font-black text-xl text-gray-300 uppercase tracking-widest bg-white">
        Please log in first
      </div>
    );
  }

  // Allow if user is SUPER_ADMIN, ADMIN, or has dynamic role
  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  const hasDynamicRole = !!user.roleId;
  const hasRole = roles.includes(user.role);

  if (!isAdmin && !hasDynamicRole && !hasRole) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center font-black text-xl text-gray-300 uppercase tracking-widest bg-white">
        Unauthorized Access
      </div>
    );
  }

  return children;
}

/**
 * ✅ Admin-Only Protected Route
 * Only renders children if user is ADMIN or SUPER_ADMIN
 */
export function AdminRoute({ children, fallback }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-lg text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center font-black text-xl text-gray-300 uppercase tracking-widest bg-white">
        Please log in first
      </div>
    );
  }

  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  const hasDynamicRole = !!user.roleId;

  if (!isAdmin && !hasDynamicRole) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center font-black text-xl text-gray-300 uppercase tracking-widest bg-white">
        Admin Access Required
      </div>
    );
  }

  return children;
}

/**
 * ✅ Super Admin-Only Protected Route
 * Only renders children if user is SUPER_ADMIN
 */
export function SuperAdminRoute({ children, fallback }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-lg text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center font-black text-xl text-gray-300 uppercase tracking-widest bg-white">
        Please log in first
      </div>
    );
  }

  if (user.role !== "SUPER_ADMIN") {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center font-black text-xl text-gray-300 uppercase tracking-widest bg-white">
        Super Admin Access Required
      </div>
    );
  }

  return children;
}
