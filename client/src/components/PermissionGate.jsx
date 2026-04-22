import { usePermission } from "../context/PermissionContext";

/**
 * ✅ Show element only if user has permission
 * Usage: <PermissionGate module="Products" action="delete"><DeleteButton /></PermissionGate>
 */
export function PermissionGate({ children, module, action = "view", fallback = null }) {
  const { hasPermission } = usePermission();

  if (!hasPermission(module, action)) {
    return fallback;
  }

  return children;
}

/**
 * ✅ Show element only if user has view access to module
 * Usage: <ModuleGate module="Products"><ProductsSection /></ModuleGate>
 */
export function ModuleGate({ children, module, fallback = null }) {
  const { canViewModule } = usePermission();

  if (!canViewModule(module)) {
    return fallback;
  }

  return children;
}

/**
 * ✅ Show element only if user has multiple permissions (AND logic)
 * Usage: <AllPermissionsGate permissions={[{module: 'Products', action: 'create'}, ...]} />
 */
export function AllPermissionsGate({ children, permissions, fallback = null }) {
  const { hasAllPermissions } = usePermission();

  if (!hasAllPermissions(permissions)) {
    return fallback;
  }

  return children;
}

/**
 * ✅ Show element only if user has any of the specified permissions (OR logic)
 * Usage: <AnyPermissionGate permissions={[...]} />
 */
export function AnyPermissionGate({ children, permissions, fallback = null }) {
  const { hasAnyPermission } = usePermission();

  if (!hasAnyPermission(permissions)) {
    return fallback;
  }

  return children;
}
