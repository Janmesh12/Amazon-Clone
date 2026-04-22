/**
 * ✅ Seed Script - Initialize Modules, Default Roles, and Test Users
 * Run: node server/seed.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const DEFAULT_MODULES = [
  { name: "Products" },
  { name: "Users" },
  { name: "Orders" },
  { name: "Sales" },
  { name: "ContactManagement" },
  { name: "Reports" },
  { name: "Settings" },
  { name: "Roles" },
];

const DEFAULT_ROLES = [
  {
    name: "Manager",
    description: "Can manage products and view orders",
    permissions: {
      Products: { view: true, create: true, update: true, delete: false },
      Users: { view: true, create: false, update: false, delete: false },
      Orders: { view: true, create: false, update: false, delete: false },
      Sales: { view: true, create: false, update: false, delete: false },
      ContactManagement: { view: false, create: false, update: false, delete: false },
      Reports: { view: true, create: false, update: false, delete: false },
      Settings: { view: false, create: false, update: false, delete: false },
      Roles: { view: false, create: false, update: false, delete: false },
    },
  },
  {
    name: "Support Staff",
    description: "Can view products, orders, and contact customer",
    permissions: {
      Products: { view: true, create: false, update: false, delete: false },
      Users: { view: true, create: false, update: false, delete: false },
      Orders: { view: true, create: false, update: true, delete: false },
      Sales: { view: false, create: false, update: false, delete: false },
      ContactManagement: { view: true, create: true, update: true, delete: false },
      Reports: { view: true, create: false, update: false, delete: false },
      Settings: { view: false, create: false, update: false, delete: false },
      Roles: { view: false, create: false, update: false, delete: false },
    },
  },
  {
    name: "Analyst",
    description: "Can view everything but cannot modify",
    permissions: {
      Products: { view: true, create: false, update: false, delete: false },
      Users: { view: true, create: false, update: false, delete: false },
      Orders: { view: true, create: false, update: false, delete: false },
      Sales: { view: true, create: false, update: false, delete: false },
      ContactManagement: { view: true, create: false, update: false, delete: false },
      Reports: { view: true, create: false, update: false, delete: false },
      Settings: { view: false, create: false, update: false, delete: false },
      Roles: { view: false, create: false, update: false, delete: false },
    },
  },
];

async function seed() {
  try {
    console.log("🌱 Starting database seeding...");

    // Create modules
    console.log("📦 Creating modules...");
    for (const module of DEFAULT_MODULES) {
      const existing = await prisma.module.findUnique({
        where: { name: module.name },
      });

      if (!existing) {
        await prisma.module.create({
          data: module,
        });
        console.log(`  ✅ Created module: ${module.name}`);
      } else {
        console.log(`  ⏭️  Module already exists: ${module.name}`);
      }
    }

    // Create default roles with permissions
    console.log("\n👥 Creating default roles...");
    for (const roleData of DEFAULT_ROLES) {
      const existing = await prisma.dynamicRole.findUnique({
        where: { name: roleData.name },
      });

      if (!existing) {
        // Create role
        const role = await prisma.dynamicRole.create({
          data: {
            name: roleData.name,
            description: roleData.description,
          },
        });

        // Assign permissions
        for (const [moduleName, actions] of Object.entries(roleData.permissions)) {
          const module = await prisma.module.findUnique({
            where: { name: moduleName },
          });

          if (module) {
            await prisma.permission.create({
              data: {
                roleId: role.id,
                moduleId: module.id,
                view: actions.view,
                create: actions.create,
                update: actions.update,
                delete: actions.delete,
              },
            });
          }
        }

        console.log(`  ✅ Created role: ${role.name}`);
      } else {
        console.log(`  ⏭️  Role already exists: ${roleData.name}`);
      }
    }

    console.log("\n✅ Seeding completed successfully!");

    // Create test accounts with roles
    console.log("\n👤 Creating test user accounts...");
    const testUsers = [
      { name: "Janmesh", email: "janmesh@test.com", password: "123456", role: "SUPER_ADMIN", dynamicRole: null },
      { name: "Pankti", email: "pankti@test.com", password: "123456", role: "ADMIN", dynamicRole: "Manager" },
      { name: "Shruti", email: "shruti@test.com", password: "123456", role: "USER", dynamicRole: "Support Staff" },
      { name: "Tanmay", email: "tanmay@test.com", password: "123456", role: "SELLER", dynamicRole: "Sales Staff" },
      { name: "Dhiraj", email: "dhiraj@test.com", password: "123456", role: "USER", dynamicRole: "Analyst" },
      { name: "Hitesh", email: "hitesh@test.com", password: "123456", role: "USER", dynamicRole: null },
    ];

    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      let dynamicRoleId = null;
      if (userData.dynamicRole) {
        const dRole = await prisma.dynamicRole.findUnique({
          where: { name: userData.dynamicRole },
        });
        dynamicRoleId = dRole?.id;
      }

      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        // Update existing user with new password
        await prisma.user.update({
          where: { email: userData.email },
          data: {
            password: hashedPassword,
            role: userData.role,
            roleId: dynamicRoleId,
            name: userData.name,
          },
        });
        console.log(`  ✅ Updated user: ${userData.name} (${userData.email}) - Password reset`);
      } else {
        // Create new user
        await prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            role: userData.role,
            roleId: dynamicRoleId,
          },
        });
        console.log(`  ✅ Created user: ${userData.name} (${userData.email}) - Role: ${userData.role}`);
      }
    }

    console.log("\n✅ All seeding completed successfully!");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
