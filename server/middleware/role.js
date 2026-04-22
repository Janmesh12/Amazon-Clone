const { hasAccess } = require('../utils/roleHierarchy');

/**
 * Role-based authorize middleware
 * Usage: authorize('ADMIN') — requires ADMIN level or above
 */
const authorize = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Add check for dynamic roles
    const isDynamicAdmin = !!req.user.roleId;

    if (!hasAccess(req.user.role, requiredRole) && !isDynamicAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  };
};

module.exports = { authorize };
