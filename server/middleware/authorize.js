const { hasAccess } = require("../utils/roleHierarchy");

/**
 * Authorization Middleware for Dynamic Roles
 * Usage: authorize("Products", "view") or authorize("Products", "create")
 */
const authorize = (moduleName, action = "view") => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.userId) {
        return res.status(401).json({ error: "Unauthorized: Not logged in" });
      }

      // SUPER_ADMIN and ADMIN always have access
      if (req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN") {
        return next();
      }

      // Base SELLER or USER role bypass if no dynamic role is assigned
      if (
        (req.user.role === "SELLER" || req.user.role === "USER") &&
        !req.user.roleId
      ) {
        return next();
      }

      // For users with dynamic roles, check permissions
      const permissions = req.user.permissions || [];
      const permission = permissions.find((p) => p.module?.name === moduleName);

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
      if (permission[action] !== true) {
        return res.status(403).json({
          error: `Permission denied: Cannot ${action} ${moduleName}`,
        });
      }

      next();
    } catch (err) {
      console.error("Authorization error:", err);
      res.status(500).json({ error: "Authorization error" });
    }
  };
};

/**
 * Requires specific base roles (SUPER_ADMIN, ADMIN, SELLER, USER)
 * Usage: requireRole("ADMIN")
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!hasAccess(req.user.role, requiredRole)) {
      return res.status(403).json({
        error: `Forbidden: ${requiredRole} access required`,
      });
    }

    next();
  };
};

// Export both as named exports and set authorize as default
module.exports = authorize;
module.exports.authorize = authorize;
module.exports.requireRole = requireRole;
