const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { requireRole } = require("../middleware/authorize");
const auth = require("../middleware/auth");

const prisma = new PrismaClient();

/**
 * ✅ GET /api/modules - List all available modules
 */
router.get("/", auth, async (req, res) => {
  try {
    const modules = await prisma.module.findMany({
      orderBy: { name: "asc" },
    });

    res.json({ success: true, data: modules });
  } catch (err) {
    console.error("Error fetching modules:", err);
    res.status(500).json({ error: "Failed to fetch modules" });
  }
});

/**
 * ✅ GET /api/modules/:id - Get a single module
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const module = await prisma.module.findUnique({
      where: { id: parseInt(id) },
      include: {
        permissions: true,
      },
    });

    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    res.json({ success: true, data: module });
  } catch (err) {
    console.error("Error fetching module:", err);
    res.status(500).json({ error: "Failed to fetch module" });
  }
});

/**
 * ✅ POST /api/modules - Create a new module
 */
router.post("/", auth, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Module name is required" });
    }

    // Check if module already exists
    const existingModule = await prisma.module.findUnique({
      where: { name: name.trim() },
    });

    if (existingModule) {
      return res.status(400).json({ error: "Module already exists" });
    }

    const newModule = await prisma.module.create({
      data: {
        name: name.trim(),
      },
    });

    res.json({ success: true, data: newModule, message: "Module created successfully" });
  } catch (err) {
    console.error("Error creating module:", err);
    res.status(500).json({ error: "Failed to create module" });
  }
});

/**
 * ✅ DELETE /api/modules/:id - Delete a module
 * Only allowed if no permissions are attached to it
 */
router.delete("/:id", auth, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;

    const module = await prisma.module.findUnique({
      where: { id: parseInt(id) },
      include: { permissions: true },
    });

    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    if (module.permissions.length > 0) {
      return res.status(400).json({
        error: `Cannot delete module: ${module.permissions.length} permission(s) attached. Please remove them first.`,
      });
    }

    await prisma.module.delete({
      where: { id: parseInt(id) },
    });

    res.json({ success: true, message: "Module deleted successfully" });
  } catch (err) {
    console.error("Error deleting module:", err);
    res.status(500).json({ error: "Failed to delete module" });
  }
});

module.exports = router;
