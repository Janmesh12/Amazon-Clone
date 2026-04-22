const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { param, body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) await validation.run(req);
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    res.status(400).json({ errors: errors.array(), error: errors.array()[0].msg });
  };
};

// ─── GET WISHLIST ──────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const items = await prisma.wishlist.findMany({
      where:   { userId: req.userId, product: { isDeleted: false } },
      include: { product: true },
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── TOGGLE WISHLIST (Add or Remove) ──────────────────────────────
router.post('/toggle', validate([
  body('product_id').isInt().withMessage('product_id required').toInt(),
]), async (req, res) => {
  const { product_id } = req.body;

  try {
    const existing = await prisma.wishlist.findFirst({
      where: { userId: req.userId, product_id: parseInt(product_id) },
    });

    if (existing) {
      // Remove if already in wishlist
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return res.json({ message: 'Removed from wishlist', action: 'removed' });
    } else {
      // Add if not in wishlist
      const item = await prisma.wishlist.create({
        data: { userId: req.userId, product_id: parseInt(product_id) },
      });
      return res.status(201).json({ message: 'Added to wishlist', action: 'added', item });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE FROM WISHLIST ──────────────────────────────────────────
router.delete('/:product_id', validate([
  param('product_id').isInt().withMessage('Invalid product_id').toInt(),
]), async (req, res) => {
  const product_id = parseInt(req.params.product_id);
  try {
    const item = await prisma.wishlist.findFirst({ where: { userId: req.userId, product_id } });
    if (!item) return res.status(404).json({ error: 'Wishlist item not found' });
    
    await prisma.wishlist.delete({ where: { id: item.id } });
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
