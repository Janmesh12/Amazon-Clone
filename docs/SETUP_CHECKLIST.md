# ✅ RBAC System - Setup & Deployment Checklist

## Pre-Setup Requirements
- [ ] Node.js 14+ installed
- [ ] PostgreSQL database running
- [ ] DATABASE_URL environment variable set
- [ ] JWT_SECRET environment variable set (or use default)

---

## 🚀 Phase 1: Initial Setup (15 minutes)

### Backend Setup
- [ ] Navigate to server directory: `cd server`
- [ ] Install dependencies: `npm install`
- [ ] Check `.env` file exists with DATABASE_URL
- [ ] Run migrations: `npx prisma migrate dev --name init_rbac`
- [ ] Run seed script: `node seed.js`
- [ ] Verify output shows modules and roles created
- [ ] Start server: `npm run dev` or `node index.js`
- [ ] Verify server starts on port 5000

### Frontend Setup
- [ ] Navigate to client directory: `cd client`
- [ ] Install dependencies: `npm install`
- [ ] Update `client/src/main.jsx`:
  - [ ] Import PermissionProvider from context
  - [ ] Wrap app with PermissionProvider (inside AuthProvider)
- [ ] Start dev server: `npm run dev`
- [ ] Verify frontend loads without errors

---

## 🧪 Phase 2: Testing (20 minutes)

### Test Authentication
- [ ] Navigate to login page
- [ ] Create test account (signup)
- [ ] Login with credentials
- [ ] Check browser console - user object should appear
- [ ] Refresh page - should stay logged in
- [ ] Logout - should clear session

### Test Permission Loading
- [ ] After login, open browser console
- [ ] Type: `localStorage.getItem('amazon_token')`
- [ ] Should see JWT token
- [ ] Check API response from `/api/auth/me`
- [ ] Should include permissions array
- [ ] Permissions should show modules and actions

### Test Role Management
- [ ] Login as ADMIN or SUPER_ADMIN user
- [ ] Navigate to `/roles` 
- [ ] Should see 3 default roles (Manager, Support Staff, Analyst)
- [ ] Click Edit on any role
- [ ] Should see all modules with checkboxes
- [ ] Try toggling a permission
- [ ] Permission should disable other actions without view
- [ ] Save changes - should see success message

### Test Permission Gates
- [ ] Create user with limited permissions
- [ ] Login with that user
- [ ] Restricted features should not be visible
- [ ] Try to access restricted route directly
- [ ] Should see "Unauthorized Access" page

---

## 📝 Phase 3: Integration (1-2 hours)

### Protect API Endpoints
For each critical endpoint:
- [ ] Add import: `const { checkPermission } = require("../middleware/permissions");`
- [ ] Add middleware after `auth`: `checkPermission("ModuleName", "action")`
- [ ] Test with user who has permission - should work
- [ ] Test with user without permission - should get 403
- [ ] Document the module name for team reference

### Update React Routes
- [ ] Import protected route components
- [ ] Wrap admin routes with `<AdminRoute>`
- [ ] Wrap permission-specific routes with `<ProtectedRoute>`
- [ ] Test navigation to restricted routes
- [ ] Verify unauthorized users see error page

### Add Permission Gates to Components
Find UI elements that should be conditional:
- [ ] Action buttons (Edit, Delete, etc.)
- [ ] Navigation links to restricted areas
- [ ] Form sections for restricted features
- [ ] Admin panels and tools

For each element:
- [ ] Import PermissionGate or usePermission
- [ ] Check permission before rendering
- [ ] Show alternative UI if no permission
- [ ] Test with restricted user accounts

### Create Default Roles for Your Team
- [ ] Login as SUPER_ADMIN
- [ ] Go to `/roles`
- [ ] Create role for each position:
  - [ ] Manager
  - [ ] Support Staff
  - [ ] Analyst
  - [ ] Any custom roles needed
- [ ] Edit each role and set permissions
- [ ] Assign test users to test roles
- [ ] Verify only assigned features visible

---

## 🚨 Phase 4: Security Review (30 minutes)

### Backend Security
- [ ] Verify auth middleware used on all protected routes
- [ ] Verify permission checks in place
- [ ] Check view access rule enforced
- [ ] Verify hashedPasswords used
- [ ] Check JWT secret stored in env (not hardcoded)
- [ ] Verify CORS set appropriately
- [ ] Check rate limiting if needed

### Frontend Security
- [ ] Verify token stored in localStorage (not cookies)
- [ ] Check JWT token sent in Authorization header
- [ ] Verify endpoints called from frontend pass token
- [ ] Check sensitive data not logged to console
- [ ] Verify no permissions hardcoded
- [ ] Check no sensitive data in component state

### Data Security
- [ ] Database backups configured
- [ ] Sensitive endpoints logged
- [ ] Error messages don't expose internals
- [ ] SQL injection not possible (Prisma safe)
- [ ] No default credentials left in code

---

## 📊 Phase 5: Testing Scenarios (30 minutes)

### Scenario 1: User with View Only
- [ ] Create role with view=true, all others false
- [ ] Assign user to role
- [ ] User can see features
- [ ] Create/Edit/Delete buttons hidden or disabled
- [ ] API calls to create/update/delete return 403

### Scenario 2: User with Create Permission
- [ ] Create role with view=true, create=true
- [ ] User can see CREATE button
- [ ] User can create items
- [ ] User cannot edit existing items (no update)
- [ ] User cannot delete items (no delete)

### Scenario 3: New Admin User
- [ ] Create new user account
- [ ] Promote to ADMIN role
- [ ] Should have access to everything
- [ ] View access rule shouldn't affect ADMIN
- [ ] Can manage roles and permissions

### Scenario 4: Permission Change
- [ ] User logged in with limited permissions
- [ ] Admin removes one permission
- [ ] User page should still show old permissions
- [ ] User refreshes page
- [ ] New permissions take effect
- [ ] Restricted buttons now hidden

### Scenario 5: Role Deletion
- [ ] Try to delete role with users assigned
- [ ] Should get error "users assigned to this role"
- [ ] Reassign users to different role
- [ ] Now can delete the empty role

---

## 🎯 Phase 6: Documentation (15 minutes)

### Team Documentation
- [ ] Document module names used (for consistency)
- [ ] Document permission matrix (who needs what)
- [ ] Document role templates (common combinations)
- [ ] Document how to create new roles
- [ ] Document how to troubleshoot access issues
- [ ] Document API endpoints with examples

### Code Documentation
- [ ] Add comments to protected endpoints
- [ ] Document module names at top of files
- [ ] Document permission schema in README
- [ ] Add setup instructions to README
- [ ] Document environment variables needed
- [ ] Document default roles and their purpose

### User Documentation
- [ ] Document how to request access
- [ ] Document what each role can do
- [ ] Document how to appeal denials
- [ ] Document support contact
- [ ] Document FAQ for common issues

---

## 🚢 Phase 7: Deployment (Varies)

### Database
- [ ] Create backup of current database
- [ ] Run migrations on production: `npx prisma migrate deploy`
- [ ] Verify migrations succeeded
- [ ] Run seed on production: `node seed.js`
- [ ] Verify modules and roles created
- [ ] Check no data loss

### Backend
- [ ] Build backend if applicable
- [ ] Deploy to production server
- [ ] Set environment variables (DATABASE_URL, JWT_SECRET)
- [ ] Start process manager (PM2, systemd, etc.)
- [ ] Verify all endpoints responding
- [ ] Check logs for errors
- [ ] Monitor memory/CPU usage

### Frontend
- [ ] Build frontend: `npm run build`
- [ ] Deploy to static hosting or backend
- [ ] Clear browser cache (CDN, etc.)
- [ ] Verify all pages loading
- [ ] Test permission flow
- [ ] Check error tracking (Sentry, etc.)
- [ ] Monitor error logs

### Post-Deployment
- [ ] Create SUPER_ADMIN account manually
- [ ] Create default roles
- [ ] Assign test users
- [ ] Test full user flow
- [ ] Monitor logs for errors
- [ ] Get team feedback
- [ ] Document any issues

---

## 📋 Ongoing Maintenance

### Daily
- [ ] Monitor error logs
- [ ] Check for permission-related errors
- [ ] Verify users can access needed features

### Weekly
- [ ] Review access request logs
- [ ] Verify role assignments correct
- [ ] Check for unused roles
- [ ] Update documentation if needed

### Monthly
- [ ] Audit permission matrix
- [ ] Review security logs
- [ ] Check for privilege creep
- [ ] Update role templates if needed
- [ ] Train new admins

### Quarterly
- [ ] Review all permissions
- [ ] Audit database backups
- [ ] Update security policies
- [ ] Performance review

---

## 🆘 Troubleshooting During Setup

| Problem | Solution |
|---------|----------|
| "Database connection failed" | Check DATABASE_URL env var and PostgreSQL running |
| "seed.js failed" | Check database is accessible, try `npx prisma db push` first |
| "PermissionProvider not found" | Verify file exists at `client/src/context/PermissionContext.jsx` |
| "/roles page shows nothing" | Check `npm run dev` is running and seed.js completed |
| "Permission denied" errors | Check user doesn't have permission, assign role |
| "Module not found" | Check module name exact match (case-sensitive) |
| "Buttons still showing" | Check PermissionGate wrapper added to component |

---

## ✅ Final Verification Checklist

### Before Going Live
- [ ] All tests passing
- [ ] No console errors
- [ ] No permission bypass possible
- [ ] Database backups working
- [ ] Team trained on permission system
- [ ] Runbooks documented
- [ ] On-call support ready

### After Going Live  
- [ ] Monitor logs hourly for first day
- [ ] Check user feedback
- [ ] Verify permission denials expected
- [ ] Monitor performance
- [ ] No security incidents

---

## 🎯 Success Criteria

Your implementation is successful when:

- ✅ Users can only see/do what they're permitted
- ✅ Admins can manage permissions without code
- ✅ New roles can be created instantly
- ✅ No permission bypasses possible
- ✅ Clear audit trail of who did what
- ✅ Team trained and confident
- ✅ No production incidents related to permissions

---

## 📞 Support Resources

If something goes wrong:

1. Check [REFERENCE_CARD.md](./REFERENCE_CARD.md) Troubleshooting section
2. Review [RBAC_SYSTEM.md](./RBAC_SYSTEM.md) for architecture understanding  
3. Check logs: `server/logs/` and browser console
4. Use `npx prisma studio` to inspect database
5. Test endpoints with curl/Postman
6. Check environment variables set correctly

---

## 🎉 Estimated Timeline

| Phase | Time | Complexity |
|-------|------|-----------|
| Setup | 15 min | Easy |
| Testing | 20 min | Easy |
| Integration | 2 hours | Medium |
| Security Review | 30 min | Medium |
| Testing Scenarios | 30 min | Medium |
| Documentation | 15 min | Easy |
| Deployment | 1-2 hours | Hard |
| **Total** | **5-7 hours** | - |

---

## 📌 Keep Handy

- Database credentials (secure!)
- Environment variables list
- Default user credentials (initial setup only)
- Documentation links
- Support contact info
- Emergency procedures

---

**Ready? Start with Step 1 above! 🚀**

**First command:** `node server/seed.js`

**Then:** Go to `http://localhost:3000` and test!
