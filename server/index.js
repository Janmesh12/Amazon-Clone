const express  = require('express');
const cors     = require('cors');
const path     = require('path');
require('dotenv').config();

// ── Prisma Client ──────────
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const orderRoutes    = require('./routes/orders');
const wishlistRoutes = require('./routes/wishlist');
const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/products');
const requestRoutes  = require('./routes/requests');
const supportRoutes  = require('./routes/support');
const paymentRoutes  = require('./routes/payments');
const jwt = require('jsonwebtoken');
const { param, body, validationResult } = require('express-validator');

const app  = express();
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) await validation.run(req);
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    res.status(400).json({ errors: errors.array(), error: errors.array()[0].msg });
  };
};

// Auth middleware helper
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

// ─── CART — GET (fetch cart for this session) ────────────────────
app.get('/api/cart', authenticate, async (req, res) => {
  try {
    const items = await prisma.cart.findMany({
      where:   { 
        userId: req.userId,
        product: { isDeleted: false } // Hide deleted items
      },
      include: { product: true },
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── CART — POST (add item or increment qty) ─────────────────────
app.post('/api/cart', authenticate, validate([
  body('product_id').isInt().withMessage('Invalid product_id').toInt(),
]), async (req, res) => {
  const { product_id } = req.body;
  console.log(`🛒 CART POST: User ${req.userId}, Product ${product_id}`);
  if (!product_id)
    return res.status(400).json({ error: 'product_id required' });
  try {
    const existing = await prisma.cart.findFirst({
      where: { userId: req.userId, product_id: parseInt(product_id) },
    });
    if (existing) {
      const updated = await prisma.cart.update({
        where: { id: existing.id },
        data:  { quantity: existing.quantity + 1 },
      });
      return res.json(updated);
    }
    const item = await prisma.cart.create({
      data: { userId: req.userId, product_id: parseInt(product_id), quantity: 1 },
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── CART — PUT (update quantity) ────────────────────────────────
app.put('/api/cart/:product_id', authenticate, validate([
  param('product_id').isInt().withMessage('Invalid product_id').toInt(),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be positive integer').toInt(),
]), async (req, res) => {
  const { quantity } = req.body;
  const product_id = parseInt(req.params.product_id);
  try {
    const item = await prisma.cart.findFirst({ where: { userId: req.userId, product_id } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (quantity <= 0) {
      await prisma.cart.delete({ where: { id: item.id } });
      return res.json({ message: 'Removed' });
    }
    const updated = await prisma.cart.update({
      where: { id: item.id },
      data:  { quantity },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── CART — DELETE one item ──────────────────────────────────────
app.delete('/api/cart/:product_id', authenticate, validate([
  param('product_id').isInt().withMessage('Invalid product id').toInt(),
]), async (req, res) => {
  const product_id = parseInt(req.params.product_id);
  try {
    const item = await prisma.cart.findFirst({ where: { userId: req.userId, product_id } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    await prisma.cart.delete({ where: { id: item.id } });
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── CART — DELETE all (clear cart) ─────────────────────────────
app.delete('/api/cart', authenticate, async (req, res) => {
  try {
    await prisma.cart.deleteMany({ where: { userId: req.userId } });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const adminRoutes    = require('./routes/admin');
const sellerRoutes   = require('./routes/seller');
const rolesRoutes    = require('./routes/roles');
const modulesRoutes  = require('./routes/modules');
const auth           = require('./middleware/auth');

// ─── ROUTES ───────────────────────────────────────────────────────
app.use('/api/products', productRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/orders',   authenticate, orderRoutes);
app.use('/api/wishlist', authenticate, wishlistRoutes);
app.use('/api/admin',    auth, adminRoutes);
app.use('/api/seller',   auth, sellerRoutes);
app.use('/api/requests', auth, requestRoutes);
app.use('/api/support',  supportRoutes); 
app.use('/api/payments', paymentRoutes);
app.use('/api/roles',    rolesRoutes);
app.use('/api/modules',  modulesRoutes);

// ─── SEED PRODUCTS WITH PRICES ────────────────────────────────────
const PRODUCTS = [
  { name: 'Clothes',                  image_url: '/box1_image.jpg', category: 'Fashion',     price: 1299,   rating: 4.8, numReviews: 852  },
  { name: 'Health & Personal care',   image_url: '/box2_image.jpg', category: 'Health',      price: 599,    rating: 4.2, numReviews: 432  },
  { name: 'Dinning & Chairs',         image_url: '/box3_image.jpg', category: 'Home',        price: 8999,   rating: 4.5, numReviews: 121  },
  { name: 'Samsung Galaxy S24 Ultra', image_url: '/box4_image.jpg', category: 'Electronics', price: 124999, rating: 4.9, numReviews: 10425 },
  { name: 'Makeup',                   image_url: '/box5_image.jpg', category: 'Beauty',      price: 899,    rating: 4.6, numReviews: 654  },
  { name: 'Pets',                     image_url: '/box6_image.jpg', category: 'Lifestyle',   price: 449,    rating: 4.4, numReviews: 89   },
  { name: 'Toys',                     image_url: '/box7_image.jpg', category: 'Kids',        price: 799,    rating: 4.7, numReviews: 245  },
  { name: 'New Arrival Today',        image_url: '/box8_image.jpg', category: 'Fashion',     price: 1899,   rating: 4.3, numReviews: 76   },
];

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected');

    // ─── SEED / BACKFILL DATA ──────────────────────────────────────────
    const count = await prisma.product.count();
    if (count === 0) {
      await prisma.product.createMany({ data: PRODUCTS });
      console.log('✅ Fresh products seeded');
    } else {
      // Backfill missing ratings/reviews for existing items
      for (const p of PRODUCTS) {
        await prisma.product.updateMany({
          where: { name: p.name, rating: 4.5 }, // if it was stuck on default
          data: { rating: p.rating, numReviews: p.numReviews }
        });
      }
      console.log('✅ Ratings/Reviews backfilled for existing products');
    }

    app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

startServer();              
