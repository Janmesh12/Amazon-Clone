# Dynamic RBAC & Permission System: Architecture Overview

This document provides a technical and operational explanation of the enterprise-grade **Role-Based Access Control (RBAC)** system implemented in the Amazon Clone application.

---

## 🚀 1. The Core Philosophy: "Zero-Hardcoding"
In a standard application, permissions are often hardcoded (e.g., `if (user.role === 'ADMIN')`). This is inflexible. 

In this system, **access is decoupled from role names**. Instead, access is determined by a mapping of **Modules** to **Actions** stored in the database. This allows administrators to create new roles (like "Marketing Lead" or "Data Analyst") and define their exact capabilities without changing a single line of code.

---

## 🏗️ 2. Database Architecture (The Source of Truth)
We use a relational database structure (PostgreSQL via Prisma) to manage the hierarchy:

1.  **Modules**: Represents "zones" of the app (e.g., `Products`, `Users`, `Sales`, `ContactManagement`).
2.  **Dynamic Roles**: Custom staff roles created by the Super Admin (e.g., `Manager`, `Analyst`).
3.  **Permissions Table**: The link between Roles and Modules.
    - Stores 4 boolean triggers for each module: `view`, `create`, `update`, `delete`.
    - **Inheritance**: Any user assigned a role automatically inherits these specific module triggers.

---

## 🛡️ 3. Backend Security (The Gatekeeper)
Every API request is validated by a reusable **Authorization Middleware**.

### How it works:
When an API request is made (e.g., `DELETE /api/admin/products/123`):
1.  The `authorize('Products', 'delete')` middleware executes.
2.  It identifies the user from their JWT token and looks up their `roleId`.
3.  It queries the permissions for that role in the **Products** module.
4.  If `delete` is `false`, the request is **instantaneously blocked** with a `403 Forbidden` status.

**Security Benefit**: This ensures that even if a malicious user discovers an API endpoint, they cannot execute actions unless the database explicitly gives them permission.

---

## 🎨 4. Frontend Adaptive UI (Social Engineering for UX)
The interface "morphs" in real-time based on the logged-in user's capabilities using a **Permission Context**.

### Key UI Features:
*   **Module Hiding**: If a user lacks `view` permission for a module (e.g., `Users`), the corresponding tab in the Admin Dashboard is never rendered.
*   **Action Stripping**: Inside a module, buttons (like `🗑️ Delete` or `✏️ Edit`) are wrapped in a `hasPermission()` check. If the permission is missing, the button is either removed or replaced with a "Read Only" indicator.
*   **Permission Guards**: The Role Editor (where permissions are assigned) enforces a logic-safe environment:
    *   One cannot grant "Create/Delete" access without first granting **View** access.
    *   Unchecking "View" automatically clears all other rights to prevent database inconsistency.

---

## 🔄 5. Unified Staff Experience
The system provides a seamless workflow for staff with multiple responsibilities:
*   **Cross-Navigation**: Staff can jump between the **Support Hub** (Ticket management) and the **Master Operations Hub** (Platform management) via direct header links.
*   **Role Hierarchy**: Admin-level staff are protected. A Manager cannot delete or modify a Super Admin, and no one can modify their own role, preventing accidental lockouts.

---

## ✅ 6. Why This Matters
This system meets **Industry Production Standards** because:
1.  **Scalable**: You can add 100 modules and 1000 roles without performance degradation.
2.  **Secure**: Permissions are verified on every single network request.
3.  **User-Friendly**: Staff only see the tools they need to do their jobs, reducing clutter and confusion.

---

*Documentation prepared for Janmesh Projects / Amazon Clone RBAC System.*
