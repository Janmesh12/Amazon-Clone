const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

// POST /api/orders — place order
router.post(
  "/",
  auth,
  authorize("Orders", "create"), // 🔥 RBAC
  async (req, res) => {
    try {
      const cartItems = await prisma.cart.findMany({
        where: {
          userId: req.userId,
          product: { isDeleted: false },
        },
        include: { product: true },
      });

      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Your cart is empty" });
      }

      const total = cartItems.reduce(
        (sum, item) =>
          sum + parseFloat(item.product.price) * item.quantity,
        0
      );

      const order = await prisma.order.create({
        data: {
          userId: req.userId,
          total,
          status: "Confirmed",
          items: {
            create: cartItems.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      await prisma.cart.deleteMany({ where: { userId: req.userId } });

      res.status(201).json({ order, message: "Order placed successfully!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// GET /api/orders — get user orders
router.get(
  "/",
  auth,
  authorize("Orders", "view"), // 🔥 RBAC
  async (req, res) => {
    try {
      const orders = await prisma.order.findMany({
        where: { userId: req.userId },
        include: {
          items: { include: { product: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;