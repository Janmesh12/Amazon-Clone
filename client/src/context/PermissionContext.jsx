import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const PermissionContext = createContext();

export function PermissionProvider({ children }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [allowedModules, setAllowedModules] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize permissions from user
  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setAllowedModules([]);
      return;
    }

    // SUPER_ADMIN and ADMIN bypass all permission checks — handled in hasPermission()
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      setPermissions(user.permissions || []);
      setAllowedModules(["*"]); // wildcard = all modules
      return;
    }

    if (user?.permissions && user.permissions.length > 0) {
      setPermissions(user.permissions);
      // Get list of modules user has view access to (safely handle nested module object)
      const modules = user.permissions
        .filter((p) => p.view && (p.module?.name || p.moduleName))
        .map((p) => p.module?.name || p.moduleName);
      setAllowedModules(modules);
    } else {
      setPermissions([]);
      setAllowedModules([]);
    }
  }, [user]);

  /**
   * ✅ Check if user has permission for an action on a module
   */
  const hasPermission = (moduleName, action = "view") => {
    // SUPER_ADMIN and ADMIN always have permission
    if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") return true;

    const permission = permissions.find(
      (p) => (p.module?.name || p.moduleName) === moduleName
    );
    if (!permission) return false;

    // No view = no other actions allowed
    if (!permission.view && action !== "view") return false;

    return permission[action] === true;
  };

  /**
   * ✅ Check if user has view access to a module
   * @param {string} moduleName
   * @returns {boolean}
   */
  const canViewModule = (moduleName) => {
    return hasPermission(moduleName, "view");
  };

  /**
   * ✅ Check if user can create in a module
   * @param {string} moduleName
   * @returns {boolean}
   */
  const canCreate = (moduleName) => {
    return hasPermission(moduleName, "create");
  };

  /**
   * ✅ Check if user can update in a module
   * @param {string} moduleName
   * @returns {boolean}
   */
  const canUpdate = (moduleName) => {
    return hasPermission(moduleName, "update");
  };

  /**
   * ✅ Check if user can delete in a module
   * @param {string} moduleName
   * @returns {boolean}
   */
  const canDelete = (moduleName) => {
    return hasPermission(moduleName, "delete");
  };

  /**
   * ✅ Get all permissions for a specific module
   * @param {string} moduleName
   * @returns {object|null}
   */
  const getModulePermissions = (moduleName) => {
    return permissions.find((p) => (p.module?.name || p.moduleName) === moduleName) || null;
  };

  /**
   * ✅ Check if module is accessible (has view access)
   * @param {string} moduleName
   * @returns {boolean}
   */
  const isModuleAccessible = (moduleName) => {
    // Admins have wildcard access to all modules
    if (allowedModules.includes("*")) return true;
    return allowedModules.includes(moduleName);
  };

  /**
   * ✅ Get all accessible module names
   * @returns {string[]}
   */
  const getAccessibleModules = () => {
    return allowedModules;
  };

  /**
   * ✅ Check multiple permissions at once
   * @param {array} permissionsList - [{module: 'Products', action: 'view'}, ...]
   * @returns {boolean} - True only if user has ALL permissions
   */
  const hasAllPermissions = (permissionsList) => {
    return permissionsList.every(({ module: moduleName, action }) =>
      hasPermission(moduleName, action)
    );
  };

  /**
   * ✅ Check if user has ANY of the specified permissions
   * @param {array} permissionsList - [{module: 'Products', action: 'create'}, ...]
   * @returns {boolean}
   */
  const hasAnyPermission = (permissionsList) => {
    return permissionsList.some(({ module: moduleName, action }) =>
      hasPermission(moduleName, action)
    );
  };

  const value = {
    permissions,
    allowedModules,
    loading,
    // Main check function
    hasPermission,
    // Convenience functions
    canViewModule,
    canCreate,
    canUpdate,
    canDelete,
    getModulePermissions,
    isModuleAccessible,
    getAccessibleModules,
    hasAllPermissions,
    hasAnyPermission,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * ✅ Hook to use Permission context
 */
export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermission must be used within PermissionProvider");
  }
  return context;
};
