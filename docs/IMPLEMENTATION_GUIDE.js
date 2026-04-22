/**
 *  IMPLEMENTATION GUIDE: How to Integrate Permission Checks
 * 
 * This file shows examples of how to update your existing routes
 * to use the new Dynamic RBAC system.
 */

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Simple Permission Check (Backward Compatible)
// ═══════════════════════════════════════════════════════════════════════════

const express = require("express");
const auth = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

/**
 * ✅ BEFORE (Old way - still works with default roles)
 */
router.post("/products", auth, authorize("Products", "create"), async (req, res) => {
  // This checks if user is SUPER_ADMIN or ADMIN, OR
  // has dynamic role with "Products" module and "create" permission
  try {
    // Create product logic
    res.json({ success: true, message: "Product created" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Strict Permission Check (Recommended for Dynamic Roles)
// ═══════════════════════════════════════════════════════════════════════════

const { checkPermission } = require("../middleware/permissions");

/**
 * ✅ AFTER (New way - better for dynamic roles)
 */
router.post("/products", auth, checkPermission("Products", "create"), async (req, res) => {
  // This ONLY allows if user has explicit "view" and "create" permissions
  // on "Products" module (follows the view access rule)
  try {
    // Create product logic
    res.json({ success: true, message: "Product created" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Multiple Actions Check
// ═══════════════════════════════════════════════════════════════════════════

const { checkPermissions } = require("../middleware/permissions");

/**
 * Endpoint that requires multiple permissions
 */
router.post("/admin/bulk-delete-products", auth, checkPermissions([
  { module: "Products", action: "view" },    // Must have view
  { module: "Products", action: "delete" },  // And delete
]), async (req, res) => {
  try {
    // Bulk delete logic
    res.json({ success: true, message: "Products deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete products" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Admin Users (Legacy Role-Based)
// ═══════════════════════════════════════════════════════════════════════════

const { requireRole } = require("../middleware/authorize");

/**
 * Endpoint that requires specific base role (SUPER_ADMIN only)
 */
router.post("/admin/system-settings", auth, requireRole("SUPER_ADMIN"), async (req, res) => {
  // This only allows SUPER_ADMIN users (legacy role system)
  try {
    // System settings logic
    res.json({ success: true, message: "Settings updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Complex Scenario
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/orders
 * - View orders (needs view permission)
 */
router.get("/orders", auth, checkPermission("Orders", "view"), async (req, res) => {
  try {
    // Fetch and return orders
    res.json({ success: true, data: [] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * POST /api/orders
 * - Create order (needs view + create permission)
 */
router.post("/orders", auth, checkPermission("Orders", "create"), async (req, res) => {
  try {
    // Create order logic
    res.json({ success: true, message: "Order created" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create order" });
  }
});

/**
 * PUT /api/orders/:id
 * - Update order (needs view + update permission)
 */
router.put("/orders/:id", auth, checkPermission("Orders", "update"), async (req, res) => {
  try {
    // Update order logic
    res.json({ success: true, message: "Order updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

/**
 * DELETE /api/orders/:id
 * - Delete order (needs view + delete permission)
 */
router.delete("/orders/:id", auth, checkPermission("Orders", "delete"), async (req, res) => {
  try {
    // Delete order logic
    res.json({ success: true, message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete order" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Using Permission Info in Handler
// ═══════════════════════════════════════════════════════════════════════════

const { hasPermission } = require("../middleware/permissions");

/**
 * Get user's statistics based on their permissions
 */
router.get("/dashboard", auth, async (req, res) => {
  try {
    const stats = {};

    // Get product stats only if user can view products
    if (hasPermission(req.user.permissions, "Products", "view")) {
      stats.products = await getProductStats();
    }

    // Get order stats only if user can view orders
    if (hasPermission(req.user.permissions, "Orders", "view")) {
      stats.orders = await getOrderStats();
    }

    // Get user stats only if user can view users
    if (hasPermission(req.user.permissions, "Users", "view")) {
      stats.users = await getUserStats();
    }

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// QUICK REFERENCE: Permission Checking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * In middleware (protect route):
 * ──────────────────────────────
 * authorize("ProductName", "action")
 * checkPermission("ProductName", "action")
 * checkPermissions([...])
 * requireRole("ROLE")
 *
 * In handler logic:
 * ────────────────
 * hasPermission(req.user.permissions, "Module", "action")
 */

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATION CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Steps to migrate existing routes:
 * 
 * 1. [ ] Identify all protected routes
 * 2. [ ] Determine which module each route belongs to
 * 3. [ ] Determine which action(s) each route performs
 * 4. [ ] Replace authorization middleware:
 *        OLD: authorize("ROLE")
 *        NEW: checkPermission("Module", "action")
 * 5. [ ] Test each route with different user roles
 * 6. [ ] Update frontend UI to check permissions
 * 7. [ ] Document module names and actions
 * 8. [ ] Create admin roles with appropriate permissions
 * 9. [ ] Train admins on permission management
 * 10. [ ] Monitor for permission-related errors
 */

module.exports = router;

// ═══════════════════════════════════════════════════════════════════════════
// COMMON MODULE NAMES (Use Consistently)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Recommended module names for consistency:
 * 
 * Products              - Product management
 * Users                 - User management
 * Orders                - Order management
 * Sales                 - Sales analytics
 * ContactManagement     - Contact/support management
 * Reports               - Reporting and analytics
 * Settings              - System settings
 * Roles                 - Role management
 * Payments              - Payment processing
 * Inventory             - Inventory management
 * Marketing             - Marketing campaigns
 * CustomerSupport       - Customer support tickets
 * 
 * Keep names in PascalCase for consistency!
 */
