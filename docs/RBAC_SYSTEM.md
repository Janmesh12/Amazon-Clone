# Dynamic Role-Based Access Control (RBAC) System

## 📋 Overview

This comprehensive RBAC system allows admins to dynamically manage user permissions without code changes. The system is built on three core concepts:

1. **Modules** - Different parts of the application (Products, Users, Orders, etc.)
2. **Roles** - Groups of users with specific permission sets
3. **Permissions** - Actions (view, create, update, delete) allowed for each module per role

## 🏗️ Architecture

### Database Schema

```
User
  ├── role (RoleType: SUPER_ADMIN, ADMIN, SELLER, USER)
  ├── roleId (links to DynamicRole for fine-grained permissions)
  └── dynamicRole (DynamicRole)

Module
  ├── id
  └── name (e.g., "Products", "Orders", "Users")

DynamicRole
  ├── id
  ├── name (e.g., "Manager", "Support Staff")
  ├── permissions[] (Permission[])
  └── users[] (User[])

Permission
  ├── roleId
  ├── moduleId
  ├── view (Boolean)
  ├── create (Boolean)
  ├── update (Boolean)
  └── delete (Boolean)
```

## 🔐 Key Rule: The View Access Rule

⚠️ **IMPORTANT**: Users must have VIEW access to a module before they can perform any other action (create, update, delete).

This rule is enforced in:
- ✅ Backend: `middleware/permissions.js`
- ✅ Frontend: `PermissionContext.jsx`

```javascript
// View access is prerequisite for all actions
if (!permission.view && action !== "view") {
  return false; // Cannot perform action without view access
}
```

## 🛠️ Backend Implementation

### 1. Middleware

#### `middleware/auth.js` - Authentication
```javascript
const auth = require("./middleware/auth");

app.get("/api/protected", auth, (req, res) => {
  // req.user contains: id, email, role, permissions[]
});
```

#### `middleware/permissions.js` - Permission Checking
```javascript
const { checkPermission } = require("./middleware/permissions");

// Single permission check
router.post("/products", checkPermission("Products", "create"), handler);

// Multiple permissions
router.delete(
  "/products/:id", 
  checkPermissions([
    { module: "Products", action: "view" },
    { module: "Products", action: "delete" }
  ]), 
  handler
);
```

#### `middleware/authorize.js` - Authorization
```javascript
const { authorize, requireRole } = require("./middleware/authorize");

// Check module permission (new system)
router.get("/products", authorize("Products", "view"), handler);

// Check base role (legacy system)
router.delete("/settings", requireRole("SUPER_ADMIN"), handler);
```

### 2. Routes

#### Role Management (`routes/roles.js`)
```javascript
GET    /api/roles              - List all roles
GET    /api/roles/:id          - Get single role with permissions
POST   /api/roles              - Create new role
PUT    /api/roles/:id          - Update role details
PUT    /api/roles/:id/permissions - Update permissions for role
DELETE /api/roles/:id          - Delete role
GET    /api/roles/:id/users    - Get users assigned to role
```

#### Module Management (`routes/modules.js`)
```javascript
GET    /api/modules            - List all modules
GET    /api/modules/:id        - Get module details
POST   /api/modules            - Create new module
DELETE /api/modules/:id        - Delete module
```

#### Authentication (`routes/auth.js`)
```javascript
POST   /api/auth/login         - Login (returns user with permissions)
POST   /api/auth/signup        - Register new user
GET    /api/auth/me            - Get current user with permissions
```

### 3. Seed Data

Run the seed script to initialize default modules and roles:
```bash
node server/seed.js
```

This creates:
- **Modules**: Products, Users, Orders, Sales, ContactManagement, Reports, Settings, Roles
- **Roles**: Manager, Support Staff, Analyst (with pre-configured permissions)

## 🎨 Frontend Implementation

### 1. Contexts

#### `PermissionContext`
```javascript
import { PermissionProvider, usePermission } from "./context/PermissionContext";

function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
        <YourApp />
      </PermissionProvider>
    </AuthProvider>
  );
}

// In any component:
function MyComponent() {
  const { hasPermission, canCreate, canUpdate, getAccessibleModules } = usePermission();
  
  // Check specific permission
  if (hasPermission("Products", "create")) {
    // Show create button
  }
  
  // Check if can perform multiple actions
  if (canCreate("Products") && canUpdate("Products")) {
    // Show form with edit capabilities
  }
  
  // Get all accessible modules
  const modules = getAccessibleModules();
}
```

### 2. Permission Hook Methods

All methods in `usePermission()`:

```javascript
// Core check function
hasPermission(moduleName, action)                    // Generic permission check
hasPermission("Products", "view")                    // true/false
hasPermission("Orders", "delete")                    // true/false

// Convenience functions
canViewModule(moduleName)                            // Check view access
canCreate(moduleName)                                // Check create permission
canUpdate(moduleName)                                // Check update permission
canDelete(moduleName)                                // Check delete permission

// Utility functions
getModulePermissions(moduleName)                     // Get all permissions object
isModuleAccessible(moduleName)                       // Has view access?
getAccessibleModules()                               // Get array of accessible modules
hasAllPermissions(permissionsList)                   // Check multiple (AND)
hasAnyPermission(permissionsList)                    // Check multiple (OR)
```

### 3. Example: Conditional UI

```javascript
import { usePermission } from "../context/PermissionContext";

function ProductsPage() {
  const { canViewModule, canCreate, canUpdate, canDelete } = usePermission();
  
  // Don't show module at all if no view access
  if (!canViewModule("Products")) {
    return <div>You don't have access to Products</div>;
  }
  
  return (
    <div>
      <h1>Products</h1>
      
      {/* Show create button only if has permission */}
      {canCreate("Products") && (
        <button onClick={handleCreate}>+ Add Product</button>
      )}
      
      {/* Show products list */}
      <ProductList 
        onEdit={canUpdate("Products") ? handleEdit : null}
        onDelete={canDelete("Products") ? handleDelete : null}
      />
    </div>
  );
}
```

## 📱 Usage Examples

### Backend: Protect an API endpoint

```javascript
const { checkPermission } = require("../middleware/permissions");
const auth = require("../middleware/auth");

// Require: authenticated AND has permission
router.post(
  "/products",
  auth,
  checkPermission("Products", "create"),
  async (req, res) => {
    // Create product
  }
);
```

### Frontend: Check permissions before rendering

```javascript
import { usePermission } from "../context/PermissionContext";

function Navbar() {
  const { getAccessibleModules, hasPermission } = usePermission();
  
  const modules = getAccessibleModules();
  
  return (
    <nav>
      {modules.map(module => (
        <NavLink key={module} to={`/${module.toLowerCase()}`}>
          {module}
        </NavLink>
      ))}
    </nav>
  );
}
```

## 🔄 Permission Flow

### Login Flow
1. User logs in via `/api/auth/login`
2. Backend returns JWT token + user data with permissions
3. Frontend stores token in localStorage
4. On page reload, `/api/auth/me` fetches updated permissions
5. PermissionContext updates with user's permissions

### API Request Flow
1. Frontend sends request with JWT token
2. Backend auth middleware verifies token and loads user permissions
3. Permission middleware checks if user has access to module/action
4. If no access, return 403 Forbidden
5. If access granted, proceed with request

### Permission Check Flow
```
User wants to perform action
  ↓
Check: User authenticated? (401)
  ↓
Check: Super Admin or Admin? → Grant access
  ↓
Check: Has dynamic role permissions? (403)
  ↓
Check: Has VIEW permission for module? (403)
  ↓
Check: Has specific action permission? (403)
  ↓
✅ Allowed - proceed with request
```

## 🎓 Best Practices

### Backend
1. **Always check auth first**: `auth` middleware before `authorize`
2. **Always validate permissions**: Use `checkPermission` for every protected endpoint
3. **Follow the view rule**: Don't allow create/update/delete without view access
4. **Log permission denials**: For security auditing

### Frontend
1. **Wrap app in providers**: `AuthProvider` → `PermissionProvider`
2. **Check permissions early**: Don't render components without checking access
3. **Hide UI elements**: Don't show buttons/links user can't access
4. **Show helpful messages**: Tell users why they don't have access
5. **Cache permissions**: Use context to avoid repeated checks

## 🚀 Deployment Checklist

- [ ] Run `node server/seed.js` to initialize modules and roles
- [ ] Update admin.js to use new permission system
- [ ] Update all protected routes with `checkPermission` middleware
- [ ] Wrap frontend app with `PermissionProvider`
- [ ] Test permission checks for all admin functions
- [ ] Create Super Admin user for initial setup
- [ ] Document module names for your team
- [ ] Set up role templates for common use cases

## 🐛 Troubleshooting

### "Access denied: No access to X module"
- User doesn't have this module assigned in their role
- Solution: Assign module permission from admin panel

### "Cannot create X: View access required"
- User has create permission but no view permission
- Solution: Give view permission to use any other action

### Permissions not updating after role change
- Frontend cache needs to be cleared
- Solution: Clear localStorage or refresh page

### "Invalid token"
- JWT token expired or invalid
- Solution: Re-login

## 📚 Files Overview

```
Backend:
├── middleware/
│   ├── auth.js                 # JWT verification
│   ├── permissions.js          # Permission checking
│   └── authorize.js            # Authorization for modules/roles
├── routes/
│   ├── auth.js                 # Login, signup, me endpoint
│   ├── roles.js                # Role management CRUD
│   ├── modules.js              # Module management
│   ├── admin.js                # Admin endpoints (use checkPermission)
│   └── ... other routes
└── seed.js                     # Initialize modules and default roles

Frontend:
├── context/
│   ├── AuthContext.jsx         # Authentication state
│   └── PermissionContext.jsx   # Permission checking utils
├── pages/
│   ├── RoleManagement.jsx      # List all roles
│   ├── RoleEdit.jsx            # Edit role permissions
│   └── ... other pages
└── hooks/ (optional)
    └── usePermission.js        # Custom hook (already in context)
```

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready
