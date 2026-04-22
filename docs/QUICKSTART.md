#  RBAC System - Quick Start Guide

## What's Included

Your Amazon Clone now has a **production-ready Dynamic Role-Based Access Control (RBAC) system** with:

### Backend Components
- Authentication middleware with permission loading
- Permission checking middleware for module-based access
- Dynamic role management API
- Module management API
- Seed script for initialization

### Frontend Components
- PermissionContext for global permission state
- Protected route components
- Permission gate components
- Role management pages
- Admin dashboard

### Core Features
- Admin can create unlimited roles dynamically
- Each role has fine-grained permissions (view, create, update, delete)
- View access is prerequisite for all actions
- Automatic UI adjustment based on permissions
- Backward compatible with existing role system

---

## ⚡ Quick Start (5 minutes)

### Step 1: Install Dependencies (if not already done)
```bash
cd server
npm install bcryptjs jsonwebtoken  # Already included likely

cd ../client
npm install axios react-hot-toast  # Already included likely
```

### Step 2: Initialize Database
```bash
cd server
npx prisma migrate dev --name init_rbac
npm run seed  # OR: node seed.js
```

This will:
- Create all database tables
- Initialize 9 default modules (Products, Users, Orders, etc.)
- Create 3 sample roles (Manager, Support Staff, Analyst) with permissions

### Step 3: Update Frontend App.jsx
```javascript
// Add PermissionProvider to your app

import { PermissionProvider } from "./context/PermissionContext";

function App() {
  return (
    <AuthProvider>
      <PermissionProvider>  {/* Add this */}
        <UIProvider>
          {/* Your app content */}
        </UIProvider>
      </PermissionProvider>
    </AuthProvider>
  );
}
```

### Step 4: Add Routes (in App.jsx)
```javascript
import { AdminRoute } from "./components/ProtectedRoute";
import RoleManagement from "./pages/RoleManagement";
import RoleEdit from "./pages/RoleEdit";
import AdminDashboard from "./pages/AdminDashboard";

// Inside Routes:
<Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
<Route path="/roles" element={<AdminRoute><RoleManagement /></AdminRoute>} />
<Route path="/roles/:roleId/edit" element={<AdminRoute><RoleEdit /></AdminRoute>} />
```

### Step 5: Start Servers
```bash
# Terminal 1: Backend
cd server
npm run dev    # or node index.js

# Terminal 2: Frontend
cd client
npm run dev
```

---

## 🎯 How to Use

### For Admins: Create a New Role

1. Go to `/roles`
2. Click "Create New Role"
3. Enter role name and description
4. Click "Create"
5. Go back and click "Edit" on the new role
6. Toggle permissions for each module
7. Save permissions

### For Developers: Protect an Endpoint

**Backend (protect route):**
```javascript
const { checkPermission } = require("../middleware/permissions");
const auth = require("../middleware/auth");

router.post("/orders", auth, checkPermission("Orders", "create"), async (req, res) => {
  // Only users with "Orders" module "create" permission can access
});
```

**Frontend (show/hide UI):**
```javascript
import { usePermission } from "../context/PermissionContext";

function OrdersPage() {
  const { canCreate, hasPermission } = usePermission();
  
  if (!hasPermission("Orders", "view")) {
    return <div>No access to Orders</div>;
  }
  
  return (
    <>
      {canCreate("Orders") && <button>Create Order</button>}
      {/* Order list */}
    </>
  );
}
```

---

## 📚 Key Concepts

### Modules
Things users can access:
- Products
- Users
- Orders
- Sales
- ContactManagement
- Reports
- Settings
- Roles
- (Add your own!)

### Permissions
Actions on each module:
- **VIEW** - Can see the module
- **CREATE** - Can create items
- **UPDATE** - Can edit items
- **DELETE** - Can remove items

### The Golden Rule ⭐
> **Users MUST have VIEW permission before they can CREATE, UPDATE, or DELETE**

This is enforced automatically in both backend and frontend.

### User + Role + Permissions Flow
```
User assigned to Role (e.g., "Manager")
  ↓
Role has Permissions (e.g., Products: view=true, create=true, update=true, delete=false)
  ↓
When user logs in, permissions loaded into PermissionContext
  ↓
Components check permissions for each action
  ↓
Backend enforces permissions on API endpoints
```

---

## 🔐 Security Features

1. **JWT Authentication** - Tokens expire in 7 days
2. **Permission Checks** - Every endpoint validates user permissions
3. **View Access Rule** - Impossible to bypass by modifying frontend
4. **Admin Bypass** - SUPER_ADMIN and ADMIN users always have access

---

## 🧪 Testing

### Test 1: Create Admin User
```bash
# Via API
POST http://localhost:5000/api/auth/signup
{
  "name": "Admin User",
  "email": "admin@test.com",
  "password": "admin123",
  "mobile": "9999999999"
}

# Then manually set role in database via Prisma Studio
npx prisma studio
# Set user.role = "ADMIN"
```

### Test 2: Login and Check Permissions
```javascript
// In browser console after login:
// Frontend should show role management options
const { user } = useAuth();
console.log(user.permissions);  // Should show all permissions
```

### Test 3: Test Permission Endpoint
```bash
curl http://localhost:5000/api/roles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should return all roles if user is ADMIN/SUPER_ADMIN
```

---

## 🔧 Customization

### Add New Module

1. Create in database:
```bash
npx prisma studio
# Add new record in "Module" table
# Name: "YourModule"
```

2. Update your role permissions via admin panel `/roles`

3. Use in code:
```javascript
// Backend
router.post("/your-endpoint", auth, checkPermission("YourModule", "create"), handler);

// Frontend
<PermissionGate module="YourModule" action="create">
  <CreateButton />
</PermissionGate>
```

### Add New Action Permission

If you need more than view/create/update/delete:

1. **Update Prisma schema** - Add field to Permission model
2. **Update frontend** - Add checkbox to RoleEdit.jsx
3. **Update middleware** - Update permission check logic

---

## 🐛 Common Issues

### "Access denied: No access to X module"
**Problem:** User's role doesn't have this module permission  
**Solution:** Assign module in role edit page

### "Cannot create X: View access required"
**Problem:** User has create but not view permission  
**Solution:** Give view permission first (automatically enforced)

### Permissions not showing after login
**Problem:** Browser cache or stale token  
**Solution:** Clear localStorage: `localStorage.clear()` then refresh

### Can't access role management
**Problem:** User doesn't have admin access  
**Solution:** Set user's role to ADMIN or SUPER_ADMIN in database

---

## 📋 File Reference

### Backend Files
- `server/middleware/auth.js` - JWT verification
- `server/middleware/permissions.js` - Permission checking
- `server/middleware/authorize.js` - Authorization
- `server/routes/auth.js` - Login/signup endpoints
- `server/routes/roles.js` - Role management
- `server/routes/modules.js` - Module management
- `server/seed.js` - Initialize data

### Frontend Files
- `client/src/context/AuthContext.jsx` - Auth state
- `client/src/context/PermissionContext.jsx` - Permission state
- `client/src/components/ProtectedRoute.jsx` - Route guards
- `client/src/components/PermissionGate.jsx` - UI gates
- `client/src/pages/RoleManagement.jsx` - Role list
- `client/src/pages/RoleEdit.jsx` - Role editor
- `client/src/pages/AdminDashboard.jsx` - Admin overview

### Documentation Files
- `RBAC_SYSTEM.md` - Full system documentation
- `IMPLEMENTATION_GUIDE.js` - Code examples

---

## 🚀 Next Steps

1. ✅ Test the system locally
2. ✅ Create test users with different roles
3. ✅ Add permission checks to your existing endpoints
4. ✅ Update component UIs based on permissions
5. ✅ Create role templates for common scenarios
6. ✅ Document your module names and permissions
7. ✅ Deploy to production

---

## 📞 Support

If something doesn't work:

1. Check `server/seed.js` ran successfully
2. Verify JWT token is being sent in Authorization header
3. Check browser console for errors
4. Check server logs for permission denials
5. Use `npx prisma studio` to inspect database

---

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for Production ✅
