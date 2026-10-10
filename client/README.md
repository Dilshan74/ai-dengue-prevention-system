# DengueGuard Client (Frontend)

The frontend application for the **DengueGuard AI Prevention System**, built with React 19, Vite, and Tailwind CSS. It provides role-tailored dashboards and interfaces for Citizens, Public Health Inspectors (PHIs), and Administrators.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `VITE_API_URL` points to your active Express backend:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=
```
*(Note: If `VITE_GOOGLE_MAPS_API_KEY` is left blank, map components automatically fall back to OpenStreetMap / Leaflet).*

### 3. Run Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

---

## 🛠️ Available Scripts

- `npm run dev`: Starts the Vite development server with Hot Module Replacement (HMR).
- `npm run build`: Compiles and bundles production-ready assets into the `dist/` directory.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs ESLint code quality checks.

---

## 📂 Architecture Overview

```
client/src/
├── assets/          # Icons, branding, custom animations
├── components/      # Modular UI components
│   ├── 3d/          # Interactive Three.js 3D mosquito model
│   ├── ai/          # Image uploader with live detection overlays
│   ├── charts/      # Recharts visualizations (trends, risk, reports)
│   ├── common/      # Reusable UI primitives (Buttons, Cards, Modals, Tables)
│   ├── layout/      # Navbars, Sidebars, Footers
│   ├── maps/        # Hotspot risk maps, GPS pickers, OpenStreetMap fallback
│   └── notifications/# Toast and notification drawer items
├── context/         # React Context providers (Auth, Notifications, Theme)
├── hooks/           # Custom hooks (useAuth, useApi, useNotification, useTheme)
├── layouts/         # Role layout wrappers (CitizenLayout, PHILayout, AdminLayout)
├── pages/           # Page routes categorized by user role
│   ├── admin/       # System health, user/PHI management, monthly reports, AI accuracy
│   ├── auth/        # Login, Register, Forgot/Reset Password
│   ├── citizen/     # Image upload, AI result review, complaint tracker, risk maps
│   ├── home/        # Public landing page with 3D animation
│   └── phi/         # Inspection management, report details, inspection maps, report generation
├── routes/          # Role-based protected routing definitions
├── services/        # Axios API client modules
├── theme/           # Design tokens, color palette, typography
└── utils/           # Validation rules, formatters, and constants
```
