const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authorize = require("../middleware/authorize");
const { body } = require("express-validator");
const validate = require("../middleware/validator");
const upload = require("../middleware/upload");
const { uploadImageFromBuffer } = require("../config/cloudinary");

// All routes here require SELLER role minimum
// Auth middleware is applied at mount level in index.js

// ── GET MY PRODUCTS ───────────────────────
router.get("/products", authorize("Products", "view"), async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { sellerId: req.user.id, isDeleted: false },
      orderBy: { createdAt: "desc" },
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Error fetching products" });
  }
});

// ── ADD PRODUCT ───────────────────────────
router.post(
  "/products",
  authorize("Products", "create"),
  upload.single("image"),
  validate([
    body("name").notEmpty().withMessage("Name required"),
    body("category").notEmpty().withMessage("Category required"),
    body("price").isNumeric().withMessage("Price required"),
  ]),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Image required" });
      const result = await uploadImageFromBuffer(req.file.buffer);

      const product = await prisma.product.create({
        data: {
          name: req.body.name,
          category: req.body.category,
          price: req.body.price,
          description: req.body.description || "",
          features: req.body.features || "",
          image_url: result.secure_url,
          sellerId: req.user.id,
        },
      });
      res.status(201).json({ product });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error adding product" });
    }
  },
);

// ── UPDATE MY PRODUCT ─────────────────────
router.put(
  "/products/:id",
  authorize("Products", "update"),
  validate([
    body("name").optional().notEmpty(),
    body("price").optional().isNumeric(),
  ]),
  async (req, res) => {
    const productId = Number(req.params.id);
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) return res.status(404).json({ error: "Product not found" });
      if (product.sellerId !== req.user.id)
        return res.status(403).json({ error: "Not your product" });

      const updateData = {};
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.price) updateData.price = req.body.price;
      if (req.body.category) updateData.category = req.body.category;
      if (req.body.description !== undefined)
        updateData.description = req.body.description;
      if (req.body.features !== undefined)
        updateData.features = req.body.features;

      const updated = await prisma.product.update({
        where: { id: productId },
        data: updateData,
      });
      res.json({ product: updated });
    } catch (err) {
      res.status(500).json({ error: "Error updating product" });
    }
  },
);

// ── DELETE MY PRODUCT ─────────────────────
router.delete("/products/:id", authorize("Products", "delete"), async (req, res) => {
  const productId = Number(req.params.id);
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.sellerId !== req.user.id)
      return res.status(403).json({ error: "Not your product" });

    await prisma.product.update({
      where: { id: productId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting product" });
  }
});

// ── MY SALES (orders containing my products) ──
router.get("/sales", authorize("Sales", "view"), async (req, res) => {
  try {
    const orderItems = await prisma.orderItem.findMany({
      where: { product: { sellerId: req.user.id } },
      include: {
        product: true,
        order: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(orderItems);
  } catch (err) {
    res.status(500).json({ error: "Error fetching sales" });
  }
});

// ── MY STATS ──────────────────────────────
router.get("/stats", authorize("Products", "view"), async (req, res) => {
  try {
    const [products, salesItems] = await Promise.all([
      prisma.product.findMany({ 
        where: { sellerId: req.user.id, isDeleted: false } 
      }),
      prisma.orderItem.findMany({
        where: { product: { sellerId: req.user.id } },
        include: { order: true }
      })
    ]);
    const totalRevenue = salesItems.reduce(
      (sum, i) => sum + parseFloat(i.price) * i.quantity,
      0,
    );
    const totalSold = salesItems.reduce((sum, i) => sum + i.quantity, 0);

    res.json({
      products: products.length,
      revenue: totalRevenue,
      itemsSold: totalSold,
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching stats" });
  }
});

module.exports = router;
