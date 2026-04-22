const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

/**
 *  Auth Middleware - Verifies JWT and attaches user with permissions to req
 */
const auth = async (req, res, next) => {
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

    //  IMPORTANT: flatten permissions with module info
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

module.exports = auth;
