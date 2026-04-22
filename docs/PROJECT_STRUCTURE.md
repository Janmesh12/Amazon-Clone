#  Amazon Clone - Complete Tree Structure

This document provides a visual tree of **every file** in the project, including the Frontend, Backend, and Documentation.

```text
Amazon Clone/
├── .vscode/
│   └── settings.json
├── client/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js                # API client with JWT interceptors
│   │   ├── assets/
│   │   │   └── hero.png                # Main homepage banner asset
│   │   ├── components/
│   │   │   ├── CartSidebar.jsx         # Interactive cart overlay
│   │   │   ├── Footer.jsx              # Global footer
│   │   │   ├── Hero.jsx                # Homepage hero banner engine
│   │   │   ├── Navbar.jsx              # Global navigation & search
│   │   │   ├── PermissionGate.jsx      # UI-level RBAC gate
│   │   │   ├── ProductGrid.jsx         # Dynamic product display
│   │   │   ├── ProtectedRoute.jsx      # Generic route security guard
│   │   │   └── Stars.jsx               # Star rating visual component
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # Authentication & Login state
│   │   │   ├── CartContext.jsx         # Cart logic & items
│   │   │   ├── PermissionContext.jsx   # Dynamic RBAC permissions
│   │   │   ├── UIContext.jsx           # Global UI state (Modals/Sidebars)
│   │   │   └── WishlistContext.jsx     # User wishlist state
│   │   ├── modals/
│   │   │   ├── AuthModal.jsx           # Login/Register UI
│   │   │   ├── OrdersModal.jsx         # Order history viewer
│   │   │   ├── ProductDetailsModal.jsx # Product detail deep dive
│   │   │   ├── UserProfileModal.jsx    # Quick profile editor
│   │   │   └── WishlistModal.jsx       # Wishlist item display
│   │   ├── pages/
│   │   │   ├── AdminPage.jsx           # Admin dashboard
│   │   │   ├── ProfilePage.jsx         # User profile manager
│   │   │   ├── RoleEdit.jsx            # RBAC permission editor
│   │   │   ├── RoleManagement.jsx      # Role creation & list
│   │   │   ├── SellerPage.jsx          # Seller dashboard
│   │   │   ├── SuperAdminPage.jsx      # System-wide super settings
│   │   │   └── SupportPage.jsx         # Support ticketing interface
│   │   ├── App.jsx                     # Main router
│   │   ├── index.css                   # Global styles & Tailwind
│   │   └── main.jsx                    # React entry point
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
├── server/
│   ├── config/
│   │   └── cloudinary.js               # Image hosting config
│   ├── images/
│   │   ├── box1_image.jpg to box8_image.jpg
│   │   ├── hero_image.jpg
│   │   ├── iphone17.png
│   │   ├── ps5.png
│   │   └── xps10.png
│   ├── middleware/
│   │   ├── auth.js                     # JWT authorization
│   │   ├── authorize.js                # Role-based checks
│   │   ├── permissions.js              # Dynamic RBAC logic
│   │   ├── role.js                     # Legacy role middleware
│   │   ├── upload.js                   # Multer/Cloudinary logic
│   │   └── validator.js                # Request data validation
│   ├── prisma/
│   │   ├── schema.prisma               # DB Models (User, Role, etc.)
│   │   └── migrations/                 # Migration history (SQL files)
│   ├── routes/
│   │   ├── admin.js                    # Admin tools & stats
│   │   ├── auth.js                     # User registration & login
│   │   ├── modules.js                  # System module CRUD
│   │   ├── orders.js                   # Order management
│   │   ├── payments.js                 # Razorpay integration
│   │   ├── products.js                 # Product catalog & CRUD
│   │   ├── requests.js                 # Access request handling
│   │   ├── roles.js                    # Dynamic role management
│   │   ├── seller.js                   # Seller specific features
│   │   ├── support.js                  # Support tickets
│   │   └── wishlist.js                 # User wishlists
│   ├── utils/
│   │   └── roleHierarchy.js            # Permission inheritance logic
│   ├── .env                            # Sensitive keys
│   ├── index.js                        # Server entry point
│   ├── package.json
│   └── seed.js                         # Database initial seed

```
## 🚀 Technology Stack Recap
- **Total Frontend Files**: ~40 core files
- **Total Backend Files**: ~30 core files
- **Styling**: Tailwind CSS v4 (100% utility-based)
- **Database**: PostgreSQL via Prisma
- **Payments**: Razorpay Integration
