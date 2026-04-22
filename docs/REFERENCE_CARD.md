# RBAC Reference Card

## 🔷 Backend Usage

### Middleware: Check Permission
```javascript
const { checkPermission } = require("../middleware/permissions");
const auth = require("../middleware/auth");

// Single permission check
router.post("/products", auth, checkPermission("Products", "create"), handler);

// Multiple permissions (all must pass)
router.delete(
  "/products/:id", 
  auth, 
  checkPermissions([
    { module: "Products", action: "view" },
    { module: "Products", action: "delete" }
  ]), 
  handler
);
```

### Middleware: Check Role (Legacy)
```javascript
const { requireRole } = require("../middleware/authorize");

// Only SUPER_ADMIN can access
router.post("/system-settings", auth, requireRole("SUPER_ADMIN"), handler);
```

### Inside Handler: Check Permission
```javascript
const { hasPermission } = require("../middleware/permissions");

router.get("/dashboard", auth, async (req, res) => {
  const stats = {};
  
  if (hasPermission(req.user.permissions, "Products", "view")) {
    stats.products = await getProductStats();
  }
  
  if (hasPermission(req.user.permissions, "Orders", "view")) {
    stats.orders = await getOrderStats();
  }
  
  res.json(stats);
});
```

---

## 🔶 Frontend Usage

### Hook: usePermission
```javascript
import { usePermission } from "../context/PermissionContext";

const {
  hasPermission,           // (module, action) => boolean
  canViewModule,           // (module) => boolean
  canCreate,               // (module) => boolean
  canUpdate,               // (module) => boolean
  canDelete,               // (module) => boolean
  getModulePermissions,    // (module) => permission object
  isModuleAccessible,      // (module) => boolean
  getAccessibleModules,    // () => string[]
  hasAllPermissions,       // (permissionsList) => boolean
  hasAnyPermission,        // (permissionsList) => boolean
} = usePermission();
```

### Protected Route: By Permission
```javascript
import { ProtectedRoute } from "../components/ProtectedRoute";

<Route path="/products" element={
  <ProtectedRoute module="Products" action="view">
    <ProductsPage />
  </ProtectedRoute>
} />
```

### Protected Route: By Role
```javascript
import { AdminRoute } from "../components/ProtectedRoute";

<Route path="/admin" element={
  <AdminRoute>
    <AdminPage />
  </AdminRoute>
} />
```

### Permission Gate: Simple
```javascript
import { PermissionGate } from "../components/PermissionGate";

<PermissionGate module="Products" action="delete">
  <DeleteButton />
</PermissionGate>

<PermissionGate module="Products" action="create" fallback={<p>Can't create</p>}>
  <CreateButton />
</PermissionGate>
```

### Permission Gate: Complex
```javascript
// All permissions required
<AllPermissionsGate 
  permissions={[
    { module: "Products", action: "view" },
    { module: "Products", action: "delete" }
  ]}
>
  <BulkDeleteButton />
</AllPermissionsGate>

// Any permission required
<AnyPermissionGate 
  permissions={[
    { module: "Products", action: "create" },
    { module: "Products", action: "update" }
  ]}
>
  <EditButton />
</AnyPermissionGate>
```

### Conditional Rendering in Component
```javascript
function ProductsList() {
  const { hasPermission, getAccessibleModules } = usePermission();
  
  // Check if user has view access
  if (!hasPermission("Products", "view")) {
    return <div>No access</div>;
  }
  
  return (
    <div>
      <h1>Products</h1>
      
      {/* Show buttons only if user has permission */}
      {hasPermission("Products", "create") && (
        <button onClick={handleCreate}>+ Add</button>
      )}
      
      {hasPermission("Products", "update") && (
        <button onClick={handleEdit}>Edit</button>
      )}
      
      {hasPermission("Products", "delete") && (
        <button onClick={handleDelete}>Delete</button>
      )}
      
      {/* List items */}
    </div>
  );
}
```

### Get List of Accessible Modules
```javascript
function Navbar() {
  const { getAccessibleModules } = usePermission();
  
  const modules = getAccessibleModules(); // ["Products", "Orders", "Users"]
  
  return (
    <nav>
      {modules.map(module => (
        <a key={module} href={`/${module.toLowerCase()}`}>
          {module}
        </a>
      ))}
    </nav>
  );
}
```

---

## 📊 Permission Matrix Example

```
User Role: "Manager"
├── Products: view ✓, create ✓, update ✓, delete ✗
├── Orders: view ✓, create ✗, update ✗, delete ✗
├── Users: view ✓, create ✗, update ✗, delete ✗
├── Sales: view ✓, create ✗, update ✗, delete ✗
├── ContactManagement: view ✗, create ✗, update ✗, delete ✗
├── Reports: view ✓, create ✗, update ✗, delete ✗
├── Settings: view ✗, create ✗, update ✗, delete ✗
└── Roles: view ✗, create ✗, update ✗, delete ✗
```

---

## 🔄 API Endpoints

### Roles
```
GET    /api/roles                  # List all roles
GET    /api/roles/:id              # Get one role
POST   /api/roles                  # Create role
PUT    /api/roles/:id              # Update role details
PUT    /api/roles/:id/permissions  # Update role permissions
DELETE /api/roles/:id              # Delete role
GET    /api/roles/:id/users        # Get users in role
```

### Modules
```
GET    /api/modules                # List all modules
GET    /api/modules/:id            # Get one module
POST   /api/modules                # Create module
DELETE /api/modules/:id            # Delete module
```

### Auth
```
POST   /api/auth/login             # Login (returns permissions)
POST   /api/auth/signup            # Register
GET    /api/auth/me                # Get current user + permissions
```

---

## 🎯 Common Patterns

### Pattern 1: Admin Section (Admin Only)
```javascript
<AdminRoute>
  <AdminSection />
</AdminRoute>
```

### Pattern 2: Feature Toggle (Permission Based)
```javascript
{hasPermission("Reports", "view") && <ReportsTab />}
```

### Pattern 3: Action Buttons (Show If Permitted)
```javascript
<button disabled={!hasPermission("Products", "delete")}>
  Delete
</button>
```

### Pattern 4: Breadcrumb Navigation (Accessible Modules)
```javascript
<nav>
  {getAccessibleModules().map(m => <Link>{m}</Link>)}
</nav>
```

### Pattern 5: API Fallback (Graceful Degradation)
```javascript
const stats = {};
if (hasPermission("Products", "view")) {
  stats.products = await api.get("/products");
}
// returns partial stats if user doesn't have access to all
```

---

## ⚠️ Important Rules

1. **View First** - Users must have VIEW access before CREATE/UPDATE/DELETE
   ```javascript
   // This is automatically enforced:
   if (!permission.view && action !== "view") {
     deny();  // ← Always true in middleware
   }
   ```

2. **Null Checks** - Always check if user has permissions
   ```javascript
   // Safe:
   if (hasPermission("Products", "create")) { ... }
   
   // Unsafe:
   if (user.permissions[0]) { ... }  // May be undefined
   ```

3. **Consistent Module Names** - Use exact names defined in database
   ```javascript
   ✓ "Products"         // Exact match
   ✓ "ContactManagement"
   ✗ "Product"          // Won't match
   ✗ "contact"          // Case sensitive
   ```

4. **Action Names** - Only use: view, create, update, delete
   ```javascript
   ✓ hasPermission("Products", "view")
   ✗ hasPermission("Products", "read")     // Won't work
   ✗ hasPermission("Products", "edit")     // Use 'update'
   ```

---

## 🚀 Best Practices

### ✓ DO:
- Check permissions early in components
- Use hooks for permission checks
- Hide UI elements instead of showing errors
- Log permission denials for security
- Use consistent module naming
- Test with different user roles

### ✗ DON'T:
- Rely only on frontend permission checks
- Hard-code role names
- Forget to check permissions on backend
- Show "Permission Denied" errors to users
- Keep old role-based logic alongside new system
- Cache permissions for too long

---

## 🧪 Quick Test

```javascript
// Open browser console on logged-in page:

// Get permission context
const perm = usePermission();

// Check if user can create products
console.log(perm.hasPermission("Products", "create"));  // true/false

// Get all accessible modules
console.log(perm.getAccessibleModules());  // ["Products", "Orders", ...]

// See full permission object
console.log(perm.permissions);  // Raw permissions array
```

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Permission denied on endpoint | Check middleware chain: `auth` first, then `checkPermission` |
| Button showing when it shouldn't | Verify module name matches exactly (case-sensitive) |
| Permissions not loading | Check `/api/auth/me` returns permissions array |
| All users getting all permissions | Check if user is SUPER_ADMIN/ADMIN (they bypass checks) |
| Module name not found | Use `npx prisma studio` to verify module exists |

---

**Keep this handy while implementing! 📌**
