#  Amazon Clone: Enterprise-Grade Dynamic Architecture Summary

**Objective:** Transition from a static, hardcoded application to a fully data-driven, dynamic Role-Based Access Control (RBAC) platform.

---

### 1. Dynamic Role-Based Access Control (RBAC)
Instead of hardcoded "Admin" or "User" strings, the project now utilizes a **Custom Role Engine.**
*   **Dynamic Role Creation:** Super Admin can create custom titles (e.g., "Support Staff," "Content Moderator") via the UI.
*   **Granular Permissions:** Every custom role has its own array of permission strings (e.g., `manage:orders`, `view:products`) stored in the database.
*   **Dynamic UI Filtering:** The administrative dashboard **dynamically renders tabs** based on the logged-in user's specific permission set. If a user loses a permission, the tab disappears from their screen in real-time.

### 🌐 2. Professional Data Flow (PostgreSQL + Prisma)
The entire application is now powered by a **Persistent Relational Database.**
*   **Cloudinary Integration:** Image uploads (products, avatars) are handled dynamically via server-side processing and external CDN integration.
*   **State Persistence:** Cart data, wishlist, user profiles, and order histories are all session-independent and stored in SQL tables.
*   **Relational Joins:** Advanced database queries (Prisma `include`) are used to link Users to their Dynamic Roles, ensuring high performance during authorization.

### 🎧 3. Dynamic Support & Conflict Resolution System
A dedicated interaction layer for staff and users.
*   **Staff Hub:** A streamlined, permission-protected **Support Hub** (at `/support`) that filters out sensitive Super Admin data and focuses purely on customer care.
*   **Ticket Persistence:** Customer messages ("Contact Us") are stored in a dedicated `SupportTicket` model and are viewable/manageable by authorized staff members across different dashboards.

### 🔐 4. Enhanced Security Architecture
The security layer is now "Dynamic-Aware."
*   **Middleware Protection:** Express middleware (`auth` & `authorize`) has been refactored to validate not just fixed roles, but custom database `roleId` values and permission sets.
*   **Protected React Routing:** The frontend's `ProtectedRoute` evaluates the user's role metadata dynamically to prevent unauthorized access or "White Screen" crashes.

---

**Current Status:** The project is fully dynamic. All interactions (Roles, Support, Products, Users) are database-driven and  state-synchronized.
