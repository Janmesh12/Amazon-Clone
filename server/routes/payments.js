const router = require("express").Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Get Razorpay Key ID
router.get("/key", (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

// 1. Create Order on Razorpay
router.post("/create-order", auth, async (req, res) => {
  try {
    const cartItems = await prisma.cart.findMany({
      where: { userId: req.userId, product: { isDeleted: false } },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const total = cartItems.reduce(
      (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
      0,
    );

    const options = {
      amount: Math.round(total * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

// 2. Verify Payment
router.post("/verify", auth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    // Payment verified, now create order in DB
    try {
      const cartItems = await prisma.cart.findMany({
        where: { userId: req.userId, product: { isDeleted: false } },
        include: { product: true },
      });

      const total = cartItems.reduce(
        (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
        0,
      );

      // Create Order in DB
      const order = await prisma.order.create({
        data: {
          userId: req.userId,
          total,
          status: "Confirmed",
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
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

      // Clear the cart
      await prisma.cart.deleteMany({ where: { userId: req.userId } });

      return res
        .status(200)
        .json({ message: "Payment verified successfully", order });
    } catch (error) {
      console.error("Order Creation Error:", error);
      return res
        .status(500)
        .json({ error: "Payment verified but failed to create order" });
    }
  } else {
    return res.status(400).json({ error: "Invalid signature sent!" });
  }
});

module.exports = router;
