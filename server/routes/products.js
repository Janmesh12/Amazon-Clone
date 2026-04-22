const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { query } = require("express-validator");
const auth = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const prisma = new PrismaClient();

// Validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) await validation.run(req);
    const { validationResult } = require("express-validator");
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    res
      .status(400)
      .json({ errors: errors.array(), error: errors.array()[0].msg });
  };
};

// ─── GET /api/products (fetch all with search/category) ──────────────
router.get(
  "/",
  validate([
    query("search").optional().trim().escape(),
    query("category").optional().trim().escape(),
  ]),
  async (req, res) => {
    const { search, category } = req.query;
    try {
      const where = {};
      if (search) {
        where.name = { contains: search, mode: "insensitive" };
      }
      if (category && category !== "All") {
        where.category = category;
      }

      const products = await prisma.product.findMany({
        where,
        orderBy: { id: "asc" },
      });
      res.json(products);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── DELETE /api/products/:id (delete product) ────────────────────────
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Only the seller who created it or an admin can delete
    if (product.sellerId !== req.userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Forbidden: You can only delete your own products" });
    }

    await prisma.product.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
