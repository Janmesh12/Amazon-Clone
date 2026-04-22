const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize"); // Module-based RBAC

// ───────────────── USERS ─────────────────

// GET ALL USERS — requires "Users" module view permission
router.get(
  "/users",
  auth,
  authorize("Users", "view"),
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roleId: true,
          createdAt: true,
          mobile: true,
          dynamicRole: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      // Get all dynamic roles for the dropdown
      const roles = await prisma.dynamicRole.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });

      // Also send base role types for the base role dropdown
      res.json({
        users,
        roles: ["USER", "SELLER", "ADMIN", "SUPER_ADMIN"],
        dynamicRoles: roles,
      });
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Error fetching users" });
    }
  }
);

// PATCH /api/admin/users/:id/role — Change base role (called by SuperAdminPage)
router.patch(
  "/users/:id/role",
  auth,
  authorize("Users", "update"),
  async (req, res) => {
    const { role, roleId } = req.body;

    // Prevent changing own role
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: "Cannot change your own role" });
    }

    try {
      const validRoles = ["USER", "SELLER", "ADMIN", "SUPER_ADMIN"];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const updateData = {};
      if (role) updateData.role = role;
      if (roleId !== undefined) updateData.roleId = roleId ? Number(roleId) : null;

      const updated = await prisma.user.update({
        where: { id: Number(req.params.id) },
        data: updateData,
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "ROLE_CHANGE",
          details: `Changed user ${req.params.id} role to ${role || "dynamic:"+roleId}`,
        },
      }).catch(() => {});

      res.json({ success: true, user: updated });
    } catch (err) {
      console.error("Error updating role:", err);
      res.status(500).json({ error: "Error updating role" });
    }
  }
);

// DELETE USER (ban)
router.delete(
  "/users/:id",
  auth,
  authorize("Users", "delete"),
  async (req, res) => {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }
    try {
      await prisma.user.delete({
        where: { id: Number(req.params.id) },
      });
      res.json({ message: "User deleted" });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ error: "Error deleting user" });
    }
  }
);

// ───────────────── ORDERS ─────────────────

// GET ALL ORDERS
router.get(
  "/orders",
  auth,
  authorize("Orders", "view"),
  async (req, res) => {
    try {
      const orders = await prisma.order.findMany({
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { product: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      res.status(500).json({ error: "Error fetching orders" });
    }
  }
);

// ───────────────── PRODUCTS ─────────────────

// GET ALL PRODUCTS
router.get(
  "/products",
  auth,
  authorize("Products", "view"),
  async (req, res) => {
    try {
      const products = await prisma.product.findMany({
        where: { isDeleted: false },
        include: {
          seller: { select: { id: true, name: true, email: true } },
        },
      });

      res.json(products);
    } catch (err) {
      console.error("Error fetching products:", err);
      res.status(500).json({ error: "Error fetching products" });
    }
  }
);

// DELETE PRODUCT (soft delete)
router.delete(
  "/products/:id",
  auth,
  authorize("Products", "delete"),
  async (req, res) => {
    try {
      await prisma.product.update({
        where: { id: Number(req.params.id) },
        data: { isDeleted: true, deletedAt: new Date() },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "PRODUCT_DELETED",
          details: `Deleted product ID: ${req.params.id}`,
        },
      }).catch(() => {});

      res.json({ message: "Product deleted" });
    } catch (err) {
      console.error("Error deleting product:", err);
      res.status(500).json({ error: "Error deleting product" });
    }
  }
);

// ───────────────── SELLERS ─────────────────

// GET ALL SELLERS
router.get(
  "/sellers",
  auth,
  authorize("Users", "view"),
  async (req, res) => {
    try {
      const sellers = await prisma.user.findMany({
        where: { role: "SELLER" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          _count: { select: { products: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(sellers.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        createdAt: s.createdAt,
        productCount: s._count.products,
      })));
    } catch (err) {
      console.error("Error fetching sellers:", err);
      res.status(500).json({ error: "Error fetching sellers" });
    }
  }
);

// ───────────────── STATS ─────────────────

router.get(
  "/stats",
  auth,
  // Accessible to any Admin or Staff with a dynamic role. 
  // Individual stats are filtered on the frontend based on granular permissions.
  async (req, res, next) => {
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN' || req.user.roleId) {
       return next();
    }
    return res.status(403).json({ error: "Access denied" });
  },
  async (req, res) => {
    try {
      const [users, orders, products, sellers, revenueData] = await Promise.all([
        prisma.user.count(),
        prisma.order.count(),
        prisma.product.count({ where: { isDeleted: false } }),
        prisma.user.count({ where: { role: "SELLER" } }),
        prisma.order.aggregate({ _sum: { total: true } }),
      ]);

      res.json({
        users,
        orders,
        products,
        sellers,
        revenue: Number(revenueData._sum.total || 0),
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      res.status(500).json({ error: "Error fetching stats" });
    }
  }
);

// ───────────────── AUDIT LOGS ─────────────────

router.get(
  "/audit-logs",
  auth,
  authorize("Users", "view"),
  async (req, res) => {
    try {
      const logs = await prisma.auditLog.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      res.json(logs);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      res.status(500).json({ error: "Error fetching audit logs" });
    }
  }
);

// ───────────────── SUPPORT TICKETS ─────────────────

router.get(
  "/support",
  auth,
  authorize("ContactManagement", "view"),
  async (req, res) => {
    try {
      const tickets = await prisma.supportTicket.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      res.json(tickets);
    } catch (err) {
      console.error("Error fetching support tickets:", err);
      res.status(500).json({ error: "Error fetching support tickets" });
    }
  }
);

module.exports = router;