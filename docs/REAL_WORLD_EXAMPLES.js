/**
 * ✅ REAL-WORLD EXAMPLE: Converting Existing Endpoints to RBAC
 * 
 * This shows actual before/after code for common scenarios
 */

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Simple Products List Endpoint
// ═══════════════════════════════════════════════════════════════════════════

/**
 * BEFORE: No permission checking
 */
// const beforeCode = `
// router.get("/api/products", async (req, res) => {
//   try {
//     const products = await prisma.product.findMany();
//     res.json(products);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch" });
//   }
// });
// `;

/**
 * AFTER: With RBAC
 */
const express = require("express");
const auth = require("../middleware/auth");
const { checkPermission } = require("../middleware/permissions");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.get(
  "/api/products",
  auth,  // ← Check JWT token
  checkPermission("Products", "view"),  // ← Check permission
  async (req, res) => {
    try {
      const products = await prisma.product.findMany();
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Create Products Endpoint
// ═══════════════════════════════════════════════════════════════════════════

/**
 * BEFORE: Only checks basic auth
 */
// router.post("/api/products", auth, async (req, res) => {
//   // Create product - any logged-in user could do this!
// });

/**
 * AFTER: With RBAC - Only users with Products.create permission
 */
router.post(
  "/api/products",
  auth,
  checkPermission("Products", "create"),  // ← Needs view + create
  async (req, res) => {
    try {
      const { name, price, category } = req.body;

      const product = await prisma.product.create({
        data: { name, price, category },
      });

      res.status(201).json(product);
    } catch (err) {
      res.status(500).json({ error: "Failed to create product" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Update/Edit Product
// ═══════════════════════════════════════════════════════════════════════════

router.put(
  "/api/products/:id",
  auth,
  checkPermission("Products", "update"),  // ← Needs view + update
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, category } = req.body;

      const product = await prisma.product.update({
        where: { id: parseInt(id) },
        data: { name, price, category },
      });

      res.json(product);
    } catch (err) {
      res.status(500).json({ error: "Failed to update product" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Delete Product
// ═══════════════════════════════════════════════════════════════════════════

router.delete(
  "/api/products/:id",
  auth,
  checkPermission("Products", "delete"),  // ← Needs view + delete
  async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.product.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "Product deleted" });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Get User Details (Admin Only)
// ═══════════════════════════════════════════════════════════════════════════

const { requireRole } = require("../middleware/authorize");

/**
 * BEFORE: Hardcoded role check
 */
// router.get("/api/admin/users/:id", auth, (req, res) => {
//   if (req.user.role !== "ADMIN") {
//     return res.status(403).json({ error: "Admin only" });
//   }
//   // Get user details
// });

/**
 * AFTER: Declarative role check
 */
router.get(
  "/api/admin/users/:id",
  auth,
  requireRole("ADMIN"),  // ← Clean and reusable
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Complex Endpoint - Get Reports
// ═══════════════════════════════════════════════════════════════════════════

const { checkPermissions, hasPermission } = require("../middleware/permissions");

/**
 * Endpoint that returns different data based on user permissions
 * - If user can see products, include product stats
 * - If user can see orders, include order stats
 * - If user can see sales, include sales stats
 */
router.get(
  "/api/reports",
  auth,
  checkPermission("Reports", "view"),  // ← Must have access to reports
  async (req, res) => {
    try {
      const report = {};

      // Include product stats only if user can see products
      if (hasPermission(req.user.permissions, "Products", "view")) {
        const productStats = await prisma.product.aggregate({
          _count: true,
          _avg: { price: true },
        });
        report.products = productStats;
      } else {
        report.products = { restricted: true };
      }

      // Include order stats only if user can see orders
      if (hasPermission(req.user.permissions, "Orders", "view")) {
        const orderStats = await prisma.order.aggregate({
          _count: true,
          _sum: { total: true },
        });
        report.orders = orderStats;
      } else {
        report.orders = { restricted: true };
      }

      // Include sales stats only if user can see sales
      if (hasPermission(req.user.permissions, "Sales", "view")) {
        const salesStats = {
          totalRevenue: 0,
          // ... calculate sales data
        };
        report.sales = salesStats;
      } else {
        report.sales = { restricted: true };
      }

      res.json(report);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch report" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Bulk Operations - Multiple Permission Check
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Bulk delete products - requires BOTH view and delete permissions
 */
router.post(
  "/api/products/bulk-delete",
  auth,
  checkPermissions([
    { module: "Products", action: "view" },    // Must have view first
    { module: "Products", action: "delete" },  // And delete permission
  ]),
  async (req, res) => {
    try {
      const { productIds } = req.body;

      const result = await prisma.product.deleteMany({
        where: { id: { in: productIds } },
      });

      res.json({
        message: `Deleted ${result.count} products`,
        deletedCount: result.count,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete products" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATION GUIDE: Converting Your Existing Routes
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Step 1: Identify all your existing routes
 * List them like:
 * GET    /products              - need "Products" "view"
 * POST   /products              - need "Products" "create"
 * PUT    /products/:id          - need "Products" "update"
 * DELETE /products/:id          - need "Products" "delete"
 * 
 * Step 2: Add permission middleware
 * Original:     router.post("/products", auth, handler)
 * Updated:      router.post("/products", auth, checkPermission("Products", "create"), handler)
 * 
 * Step 3: Test each endpoint with different users
 * User with view=true, create=false → Should fail
 * User with view=true, create=true → Should succeed
 * 
 * Step 4: Update frontend to show/hide accordingly
 */

// ═══════════════════════════════════════════════════════════════════════════
// QUICK REFERENCE TABLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * METHOD    ENDPOINT           PERMISSION NEEDED    MIDDLEWARE
 * ──────────────────────────────────────────────────────────────
 * GET       /products          Products.view        checkPermission("Products", "view")
 * POST      /products          Products.create      checkPermission("Products", "create")
 * PUT       /products/:id      Products.update      checkPermission("Products", "update")
 * DELETE    /products/:id      Products.delete      checkPermission("Products", "delete")
 * 
 * GET       /orders            Orders.view          checkPermission("Orders", "view")
 * POST      /orders            Orders.create        checkPermission("Orders", "create")
 * PUT       /orders/:id        Orders.update        checkPermission("Orders", "update")
 * DELETE    /orders/:id        Orders.delete        checkPermission("Orders", "delete")
 * 
 * GET       /admin/users       Users.view           checkPermission("Users", "view")
 * POST      /admin/users       Users.create         checkPermission("Users", "create")
 * PUT       /admin/users/:id   Users.update         checkPermission("Users", "update")
 * DELETE    /admin/users/:id   Users.delete         checkPermission("Users", "delete")
 */

// ═══════════════════════════════════════════════════════════════════════════
// COMMON PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pattern 1: RESTful CRUD
 */
// router.get("/:resource", auth, checkPermission(RESOURCE, "view"), list);
// router.post("/:resource", auth, checkPermission(RESOURCE, "create"), create);
// router.put("/:resource/:id", auth, checkPermission(RESOURCE, "update"), update);
// router.delete("/:resource/:id", auth, checkPermission(RESOURCE, "delete"), delete);

/**
 * Pattern 2: Admin-only Access
 */
// router.get("/admin/settings", auth, requireRole("SUPER_ADMIN"), handler);

/**
 * Pattern 3: Multiple Permissions
 */
// router.post(
//   "/admin/export",
//   auth,
//   checkPermissions([
//     { module: "Reports", action: "view" },
//     { module: "Users", action: "view" },
//   ]),
//   handler
// );

/**
 * Pattern 4: Gradual Permission Check (in handler)
 */
// router.get("/dashboard", auth, async (req, res) => {
//   const data = {};
//   if (hasPermission(req.user.permissions, "Sales", "view")) {
//     data.sales = await getSalesData();
//   }
//   if (hasPermission(req.user.permissions, "Users", "view")) {
//     data.users = await getUserData();
//   }
//   res.json(data);
// });

module.exports = router;

// ═══════════════════════════════════════════════════════════════════════════
// TESTING YOUR CONVERTED ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Using curl:
 * 
 * 1. Get JWT token (login first):
 *    POST http://localhost:5000/api/auth/login
 *    { "email": "user@test.com", "password": "pass123" }
 * 
 * 2. Copy token from response
 * 
 * 3. Test endpoint with permission:
 *    GET http://localhost:5000/api/products \
 *    -H "Authorization: Bearer YOUR_TOKEN"
 *    Result: 200 OK with products
 * 
 * 4. Test with user without permission:
 *    (Assign user role without "Products.view" permission)
 *    Result: 403 Forbidden
 * 
 * 5. Test with invalid token:
 *    Authorization: Bearer invalid_token
 *    Result: 401 Unauthorized
 */

// ═══════════════════════════════════════════════════════════════════════════
