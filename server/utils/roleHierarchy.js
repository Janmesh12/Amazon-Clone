/**
 * Role Hierarchy System
 * SUPER_ADMIN > ADMIN > SELLER > USER
 */

const ROLES = {
  USER: {
    level: 1,
    permissions: ['read:products', 'read:profile', 'manage:own_cart', 'manage:own_orders', 'manage:own_wishlist']
  },
  SELLER: {
    level: 2,
    permissions: ['manage:own_products', 'read:own_sales', 'view:own_analytics']
  },
  ADMIN: {
    level: 3,
    permissions: ['read:all_users', 'read:all_orders', 'manage:all_products', 'moderate:reviews', 'manage:orders']
  },
  SUPER_ADMIN: {
    level: 4,
    permissions: ['manage:roles', 'manage:admins', 'ban:users', 'delete:products', 'system:all', 'view:revenue']
  }
};

const hasAccess = (fromRole, toRole) => {
  if (!ROLES[fromRole] || !ROLES[toRole]) return false;
  return ROLES[fromRole].level >= ROLES[toRole].level;
};

const getLevel = (role) => ROLES[role]?.level || 0;

const getAllRoles = () => Object.keys(ROLES);

module.exports = { ROLES, hasAccess, getLevel, getAllRoles };
