const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * ✅ Dynamic Permission Checking Middleware
 * Checks if user has permission to perform an action on a module
 * Usage: checkPermission('Products', 'create')
 */
const checkPermission = (moduleName, action) => {
  return async (req, res, next) => {
    try {
      // If no user, reject
      if (!req.user || !req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // SUPER_ADMIN and ADMIN bypass all checks
      if (req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN") {
        return next();
      }

      // For dynamic roles, check permissions
      if (req.user.permissions && req.user.permissions.length > 0) {
        const permission = req.user.permissions.find(
          (p) => p.module.name === moduleName
        );

        if (!permission) {
          return res.status(403).json({
            error: `Access denied: No access to ${moduleName} module`,
          });
        }

        //  IMPORTANT RULE: No view = no other actions allowed
        if (!permission.view && action !== "view") {
          return res.status(403).json({
            error: `Cannot ${action} ${moduleName}: View access required`,
          });
        }

        // Check if action is allowed
        if (!permission[action]) {
          return res.status(403).json({
            error: `Permission denied: Cannot ${action} ${moduleName}`,
          });
        }
      } else {
        // User has no dynamic roles, reject for non-admins
        return res.status(403).json({
          error: "Access denied: No permissions assigned",
        });
      }

      next();
    } catch (err) {
      console.error("Permission check error:", err);
      res.status(500).json({ error: "Permission check failed" });
    }
  };
};

/**
 * ✅ Bulk Permission Check (for cases where you need multiple permissions)
 * Usage: checkPermissions([{module: 'Products', action: 'view'}])
 */
const checkPermissions = (permissionsList) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // SUPER_ADMIN and ADMIN bypass
      if (req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN") {
        return next();
      }

      // Check each permission
      for (const { module: moduleName, action } of permissionsList) {
        const permission = req.user.permissions?.find(
          (p) => p.module.name === moduleName
        );

        if (!permission) {
          return res.status(403).json({
            error: `Access denied: No access to ${moduleName} module`,
          });
        }

        if (!permission.view && action !== "view") {
          return res.status(403).json({
            error: `Cannot ${action} ${moduleName}: View access required`,
          });
        }

        if (!permission[action]) {
          return res.status(403).json({
            error: `Permission denied: Cannot ${action} ${moduleName}`,
          });
        }
      }

      next();
    } catch (err) {
      console.error("Permissions check error:", err);
      res.status(500).json({ error: "Permissions check failed" });
    }
  };
};

/**
 * ✅ Check if user has a specific permission (returns boolean for frontend)
 * This is useful for routes that return permission status
 */
const hasPermission = (permissions, moduleName, action) => {
  if (!permissions || permissions.length === 0) return false;

  const permission = permissions.find((p) => p.module?.name === moduleName);
  if (!permission) return false;

  // No view = no other actions allowed
  if (!permission.view && action !== "view") return false;

  return permission[action] === true;
};

module.exports = { checkPermission, checkPermissions, hasPermission };
