# 🛒 Amazon Clone - Full Stack E-Commerce Solution

A high-performance, production-ready Amazon Clone built with the modern MERN stack, featuring a sophisticated **Dynamic RBAC (Role-Based Access Control)** system, **Razorpay** payment integration, and a premium **Tailwind CSS v4** design.

---

## ✨ Key Features

### 🔐 Advanced RBAC System
- **Dynamic Roles**: Create and manage roles directly from the UI without code changes.
- **Granular Permissions**: 4-action (View, Create, Update, Delete) control across 8+ system modules.
- **Admin Dashboard**: Comprehensive dashboard for role assignment and system monitoring.
- **Secure Middleware**: JWT-based authentication with high-security clearance checks on every API route.

### 💳 E-Commerce Core
- **Payment Integration**: Seamless checkout experience using **Razorpay**.
- **Real-time Cart**: Persistent shopping cart with instant subtotal calculations.
- **Product Management**: Category-based filtering, search, and detailed product views.
- **User Experience**: Amazon-style navigation, mobile-responsive layouts, and smooth animations.

---

## 🚀 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, Tailwind CSS v4, Lucide Icons, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL / MongoDB (managed via Prisma ORM) |
| **Auth** | JSON Web Tokens (JWT), Bcrypt |
| **Payments** | Razorpay SDK |
| **Storage** | Cloudinary (Image Hosting) |

---

## 📁 Project Structure

```text
├── client/                 # Frontend (Vite + React + Tailwind)
├── server/                 # Backend (Node + Express + Prisma)
├── docs/                   # Exhaustive system documentation
└── .gitignore              # Multi-layer security configuration
```

For a full file-by-file breakdown, see: [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Local or Remote Database (Prisma compatible)
- Razorpay API Keys

### 2. Backend Setup
```bash
cd server
npm install
# Configure your .env file (DATABASE_URL, JWT_SECRET, RAZORPAY_KEY)
npx prisma migrate dev
node seed.js                # Critically important for RBAC modules
npm start
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

---

## 📖 Documentation
Detailed guides are available in the `/docs` folder:
- [Quick Start Guide](docs/QUICKSTART.md)
- [RBAC System Deep Dive](docs/RBAC_SYSTEM.md)
- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)

---

## 🤝 Contributing
This project was built as a demonstration of production-grade full-stack architecture. Feel free to explore the code and documentation for learning purposes.

---

**Developed by**: [Your Name/Team]  
**Status**: ✅ Production Ready  
**Version**: 1.0.0
