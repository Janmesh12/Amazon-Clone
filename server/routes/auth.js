const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

/**
 *  Auth Middleware
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        dynamicRole: {
          include: {
            permissions: {
              include: {
                module: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    //  IMPORTANT: attach permissions to user object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roleId: user.roleId,
      permissions: user.dynamicRole?.permissions || [],
    };

    req.userId = user.id;

    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ error: "Invalid token" });
  }
};

/**
 *  POST /api/auth/login - User login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        dynamicRole: {
          include: {
            permissions: {
              include: {
                module: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleId: user.roleId,
        avatarUrl: user.avatarUrl || null,
        dynamicRole: user.dynamicRole ? { id: user.dynamicRole.id, name: user.dynamicRole.name } : null,
        permissions: user.dynamicRole?.permissions || [],
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 *  POST /api/auth/signup - User registration
 */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password required" });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        mobile: mobile || null,
        role: "USER",
      },
    });

    // Generate JWT
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permission: [],
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

/**
 *  GET /api/auth/me - Get current user info with permissions
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        dynamicRole: {
          include: {
            permissions: {
              include: {
                module: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        roleId: user.roleId,
        avatarUrl: user.avatarUrl || null,
        dynamicRole: user.dynamicRole ? { id: user.dynamicRole.id, name: user.dynamicRole.name } : null,
        permissions: user.dynamicRole?.permissions || [],
      },
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Export router AND middleware for use in other files
module.exports = router;
module.exports.authMiddleware = authMiddleware;
