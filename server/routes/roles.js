const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { requireRole } = require("../middleware/authorize");
const auth = require("../middleware/auth");

const prisma = new PrismaClient();

/**
 * ✅ GET /api/roles - List all roles with their permissions
 */
router.get("/", auth, requireRole("ADMIN"), async (req, res) => {
  try {
    const roles = await prisma.dynamicRole.findMany({
      include: {
        permissions: {
          include: {
            module: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    res.json({
      success: true,
      data: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        userCount: role._count.users,
        permissions: role.permissions,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
    });
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

/**
 * ✅ GET /api/roles/:id - Get a single role with detailed permissions
 */
router.get("/:id", auth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;

    const role = await prisma.dynamicRole.findUnique({
      where: { id: parseInt(id) },
      include: {
        permissions: {
          include: {
            module: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    res.json({
      success: true,
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        userCount: role._count.users,
        permissions: role.permissions,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    });
  } catch (err) {
    console.error("Error fetching role:", err);
    res.status(500).json({ error: "Failed to fetch role" });
  }
});

/**
 * ✅ POST /api/roles - Create a new role
 */
router.post("/", auth, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Role name is required" });
    }

    // Check if role already exists
    const existingRole = await prisma.dynamicRole.findUnique({
      where: { name: name.trim() },
    });

    if (existingRole) {
      return res.status(400).json({ error: "Role already exists" });
    }

    const newRole = await prisma.dynamicRole.create({
      data: {
        name: name.trim(),
        description: description || null,
      },
    });

    res.json({ success: true, data: newRole, message: "Role created successfully" });
  } catch (err) {
    console.error("Error creating role:", err);
    res.status(500).json({ error: "Failed to create role" });
  }
});

/**
 * ✅ PUT /api/roles/:id - Update role details
 */
router.put("/:id", auth, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const role = await prisma.dynamicRole.findUnique({
      where: { id: parseInt(id) },
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    const updatedRole = await prisma.dynamicRole.update({
      where: { id: parseInt(id) },
      data: {
        name: name || role.name,
        description: description !== undefined ? description : role.description,
      },
    });

    res.json({ success: true, data: updatedRole, message: "Role updated successfully" });
  } catch (err) {
    console.error("Error updating role:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
});

/**
 * ✅ PUT /api/roles/:id/permissions - Update permissions for a role
 * Expects: [{moduleId, view, create, update, delete}, ...]
 */
router.put(
  "/:id/permissions",
  auth,
  requireRole("SUPER_ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const permissionsData = req.body;

      if (!Array.isArray(permissionsData)) {
        return res.status(400).json({ error: "Permissions must be an array" });
      }

      const role = await prisma.dynamicRole.findUnique({
        where: { id: parseInt(id) },
      });

      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }

      // Update permissions using transaction for consistency
      const updated = await prisma.$transaction(async (tx) => {
        // Delete existing permissions for this role
        await tx.permission.deleteMany({
          where: { roleId: parseInt(id) },
        });

        // Create new permissions
        const newPermissions = await Promise.all(
          permissionsData.map((perm) =>
            tx.permission.create({
              data: {
                roleId: parseInt(id),
                moduleId: perm.moduleId,
                view: perm.view || false,
                create: perm.create || false,
                update: perm.update || false,
                delete: perm.delete || false,
              },
              include: {
                module: true,
              },
            })
          )
        );

        return newPermissions;
      });

      res.json({
        success: true,
        data: updated,
        message: "Permissions updated successfully",
      });
    } catch (err) {
      console.error("Error updating permissions:", err);
      res.status(500).json({ error: "Failed to update permissions" });
    }
  }
);

/**
 * ✅ DELETE /api/roles/:id - Delete a role
 * Cannot delete if users are assigned to it
 */
router.delete("/:id", auth, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;

    const role = await prisma.dynamicRole.findUnique({
      where: { id: parseInt(id) },
      include: { users: true },
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    if (role.users.length > 0) {
      return res.status(400).json({
        error: `Cannot delete role: ${role.users.length} user(s) assigned to this role. Please reassign them first.`,
      });
    }

    await prisma.dynamicRole.delete({
      where: { id: parseInt(id) },
    });

    res.json({ success: true, message: "Role deleted successfully" });
  } catch (err) {
    console.error("Error deleting role:", err);
    res.status(500).json({ error: "Failed to delete role" });
  }
});

/**
 * ✅ GET /api/roles/:id/users - Get all users assigned to a role
 */
router.get("/:id/users", auth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;

    const role = await prisma.dynamicRole.findUnique({
      where: { id: parseInt(id) },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    res.json({ success: true, data: role.users });
  } catch (err) {
    console.error("Error fetching role users:", err);
    res.status(500).json({ error: "Failed to fetch role users" });
  }
});

module.exports = router;
