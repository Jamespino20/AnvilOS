# AnvilOS

> **From college thesis to production SaaS.** AnvilOS (formerly HardwareHub) is a web-based Point of Sale (POS), Inventory Management, and Supplier Management platform built for hardware stores and industrial supply businesses.

**Tech Stack:** Next.js 16.2.6 (App Router) · Prisma 7.8.0 · MySQL (Hostinger) · Tailwind CSS 4 · TypeScript · Radix UI (shadcn/ui radix-sera preset) · Auth.js v5 (Credentials, JWT)

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/Jamespino20/AnvilOS.git

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your MySQL connection string and Auth.js secrets

# Push schema to database
npx prisma db push

# Seed database
npx prisma db seed

# Start development server
npm run dev
```

## Environment Variables

| Variable              | Description                                    | Required |
| --------------------- | ---------------------------------------------- | -------- |
| `DATABASE_URL`        | MySQL connection string (`mysql://...`)        | Yes      |
| `AUTH_SECRET`         | Auth.js encryption secret                      | Yes      |
| `AUTH_URL`            | Base URL for Auth.js (e.g. `https://...`)      | Yes      |
| `NEXT_PUBLIC_API_URL` | Public API base URL                            | No       |
| `SMTP_HOST`           | SMTP server for email verification             | No       |
| `SMTP_PORT`           | SMTP port                                      | No       |
| `SMTP_USER`           | SMTP username                                  | No       |
| `SMTP_PASS`           | SMTP password                                  | No       |
| `SMTP_FROM`           | Sender email address                           | No       |

---

## Project Structure

```
AnvilOS/
├── prisma/
│   ├── schema.prisma              # 14 models + enums (MySQL)
│   ├── seed.ts                    # Database seeder
│   └── seed-data/                 # Audit log seed data
├── src/
│   ├── app/
│   │   ├── (auth)/                # Auth pages (force light mode)
│   │   │   ├── login/             # Login (username/email + TOTP)
│   │   │   ├── register/          # Registration with email verification
│   │   │   └── forgot-password/   # Password reset via email code/link
│   │   ├── (dashboard)/           # Authenticated layout with sidebar
│   │   │   ├── audit-log/         # Audit trail (search, panel, date range)
│   │   │   ├── brands/            # Brand management (independent module)
│   │   │   ├── buyers/            # Buyer profiles, order history, profile pics
│   │   │   ├── categories/        # Hierarchical categories (parent-child)
│   │   │   ├── dashboard/         # KPIs, revenue chart, recent transactions
│   │   │   ├── finance/           # Financial KPIs, cash flow, top products
│   │   │   ├── inventory/         # Product CRUD, brands, suppliers, stock
│   │   │   ├── notifications/     # Notification center with read status
│   │   │   ├── orders/            # Purchase Orders (SalePO) with delivery
│   │   │   ├── pos/               # POS Terminal with draggable cart pane
│   │   │   ├── restocks/          # Restock history with cost tracking
│   │   │   ├── settings/          # Profile, password, TOTP setup
│   │   │   ├── suppliers/         # Supplier CRUD with TIN field
│   │   │   ├── transactions/      # Transaction log with details modal
│   │   │   └── users/             # User management (SUPERADMIN only)
│   │   ├── api/
│   │   │   ├── auth/              # NextAuth v5 + register/verify/reset
│   │   │   ├── clear-cookies/     # Cookie clearing endpoint
│   │   │   ├── cron/daily-sales/  # Daily sales report cron
│   │   │   └── notifications/     # Notification CRUD endpoints
│   │   └── globals.css            # Tailwind v4 + shadcn/ui theme
│   ├── actions/
│   │   ├── index.ts               # All server actions (monolithic)
│   │   └── email.ts               # Low stock email alerts
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives
│   │   ├── sidebar.tsx            # Collapsible sidebar with nav
│   │   ├── topbar.tsx             # Top bar with notification bell
│   │   ├── dashboard-shell.tsx    # Client layout wrapper
│   │   ├── inactivity-guard.tsx   # 1-hour inactivity timeout
│   │   ├── notification-modal.tsx # Notification overlay modal
│   │   ├── settings-modal.tsx     # Settings overlay modal
│   │   ├── support-modal.tsx      # Support overlay modal
│   │   ├── export-dialog.tsx      # Export with filter labels
│   │   ├── import-button.tsx      # CSV+XLSX import
│   │   ├── csv-import.tsx         # Import parsing UI
│   │   ├── sidebar-badges.tsx     # Pending PO count badges
│   │   ├── dashboard-export.tsx   # Dashboard CSV export
│   │   └── confirm-modal.tsx      # Reusable confirm dialog
│   ├── lib/
│   │   ├── auth.ts                # Auth.js v5 config (dual-password, TOTP)
│   │   ├── prisma.ts              # Singleton Prisma client (MariaDB adapter)
│   │   ├── access.ts              # RBAC (SUPERADMIN/ADMIN/STAFF)
│   │   ├── totp.ts                # RFC-compliant TOTP (SHA1, -1/0/+1 drift)
│   │   ├── email-token.ts         # Email verification + password reset tokens
│   │   ├── mail.ts                # SMTP email helper
│   │   ├── sanitize.ts            # Input sanitization
│   │   ├── rate-limit.ts          # DB-backed rate limiting
│   │   ├── format.ts              # Date scope helpers
│   │   ├── csv.ts                 # CSV/PDF export with auto-shrink
│   │   ├── receipt.ts             # Receipt PDF generation
│   │   ├── audit.ts               # Audit logging helper
│   │   └── utils.ts               # Tailwind cn() helper
│   └── proxy.ts                   # Middleware (auth + RBAC + cookie clearing)
├── public/images/
│   ├── anvilos_landscapelogo.png
│   └── anvilos_logomark.png
├── .env.example
├── prisma.config.ts               # Prisma 7 CLI config
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## Features

### Authentication & Authorization
- **Auth.js v5** — Credentials provider with JWT strategy
- **Login** — Username or email, dual-password hashing (current + legacy)
- **Registration** — Email verification required before account activation
- **Password Reset** — 6-digit code + secure link via email
- **TOTP 2FA** — Optional authenticator app support (SHA1, -1/0/+1 window drift)
- **RBAC** — SUPERADMIN (full access), ADMIN (can't edit other admins), STAFF (limited paths)
- **Inactivity Guard** — 1-hour timeout with warning modal
- **Rate Limiting** — DB-backed per-route limits (login: 5/15min, register: 5/15min per IP)

### POS Terminal
- **Transaction Types** — Sale (Walk-in / P.O.), Return, Damage, Adjustment
- **Payment Methods** — Cash, Credit (with due date), Cheque (with bank details)
- **Delivery Methods** — Walk-in, Pickup, Delivery, COD
- **Draggable Cart Pane** — Resizable sidebar (280px–550px) via drag handle
- **Live Receipt Sidebar** — Real-time receipt preview in cart
- **Buyer Autocomplete** — Recurring buyer with address/contact/credit balance fill
- **Brand Display** — Product names include brand in parentheses

### Inventory Management
- **Product CRUD** — Name, category (parent-child), brand, supplier, pricing, stock
- **Dual Pricing** — `sellingPrice` (retail) + `unitPrice` (cost from restocks)
- **Inventory Flags** — Fast Moving, Sell by Weight, Sell by Box (mutually exclusive)
- **Stock Alerts** — Low stock / out of stock badges and email notifications
- **Inline Quantity Edit** — Admins can click-to-edit quantity directly in table
- **Column Sorting** — Product Name, Category, Supplier, Brand

### Categories & Brands
- **Hierarchical Categories** — Parent-child nesting (one level only)
- **Category Guard** — Cannot assign parent to another parent
- **Brand Module** — Independent brand management with product modals

### Suppliers
- **Supplier CRUD** — Name, contact, address, TIN (optional)
- **Product Modal** — View linked products with pagination
- **Delete Guard** — Only deletable when zero products

### Purchase Orders (SalePO)
- **Order Management** — Track Placed → Processing → On the Way → Completed
- **Delivery Tracking** — Reference number, notes, deliverer name
- **Item Controls** — On the Way status disables quantity/remove controls
- **Pending Badge** — Sidebar shows pending PO count

### Buyers
- **Buyer Profiles** — Name, type (All/Walk-In/P.O.), contact info, address
- **Profile Pictures** — Image upload in edit modal
- **Credit Tracking** — Credit balance auto-managed on credit sales
- **Product Modal** — View purchase history with pagination

### Transactions
- **Detail Modal** — Full transaction view (replaces expandable row)
- **Editable Invoice** — Click-to-edit invoice number
- **Payment Filter** — Filter by Cash/Credit
- **Vendor Fingerprint** — Shows who processed the transaction
- **Mark Credit Paid** — Button to settle outstanding credit
- **Cheque Details** — Bank name, cheque number, payee, date
- **Debit Memo** — Reference receipt for returns/damages

### Restocks
- **Cost Price Input** — Per-item cost price (stored in TransactionItem)
- **Product Grid** — 3-column layout in max-w-6xl modal
- **Grand Total** — Sum of costPrice × quantity

### Finance
- **KPI Cards** — Gross Sales, Gross Revenue, Net Revenue, Returns Loss, Restocks Cost, Damages Loss
- **Payment Breakdown** — Cash vs Credit totals (sales only)
- **Cash Flow Trend** — Daily bar chart with date filtering
- **Top Products** — Revenue-sorted product list

### Dashboard
- **Daily KPIs** — Sales, transactions, active products, low stock alerts
- **Revenue Chart** — 7-day trend
- **Recent Transactions** — Quick view with receipt links

### Audit Logs
- **Immutable Trail** — All CRUD operations logged with actor fingerprint
- **Filters** — Search, panel dropdown, date range, user/seller filter
- **Detail Modal** — Before/after delta parsing with `→` pattern detection
- **Profile Pictures** — User images in table and modal

### Users
- **User Management** — Only SUPERADMIN can edit ADMIN users
- **Profile Pictures** — Displayed in table
- **Role Toggle** — ToggleLeft/ToggleRight with confirm modal (soft delete via `isActive`)

### Notifications
- **Per-User Read Status** — NotificationRead junction table
- **Read All** — Mark all as read button
- **Pagination** — Infinite scroll with load more

### UI/UX
- **Collapsible Sidebar** — Grouped nav with collapsed margin fix
- **Dark Mode** — Class-based toggle persisted to localStorage
- **Auth Pages** — Forced light mode
- **Skeleton Loaders** — On all pages
- **Modal Scrolling** — Detail modals with internal scroll (max-h-[85vh])
- **No Backdrop Close** — All modals close only via X button
- **Export with Context** — Filenames include filter labels
- **CSV+XLSX Import** — Via xlsx package
- **PHP Prefix** — Receipts use "PHP" (not ₱) for jsPDF Courier compatibility

### Security
- **Input Sanitization** — All auth routes sanitized
- **CSP Headers** — Content Security Policy configured
- **Cache Busting** — `no-cache, no-store, must-revalidate` on all routes
- **Cookie Clearing** — Three-layer accumulated cookie clearing

---

## Database Schema (14 models)

| Model              | Purpose                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| `User`             | Users — name, username, email, passwordHash, role (SUPERADMIN/ADMIN/STAFF), TOTP, profile image |
| `Category`         | Hierarchical product categories (self-referencing parentCategoryId)    |
| `Brand`            | Product brands (independent module)                                    |
| `Supplier`         | Vendor profiles — name, contact, address, TIN                          |
| `Product`          | Inventory — sellingPrice, unitPrice, quantities, flags, brand FK      |
| `Transaction`      | Sales, returns, restocks, damages, adjustments — payment, delivery, credit, cheque |
| `TransactionItem`  | Line items — productId, qty, unitPrice (historical), costPrice         |
| `Buyer`            | Customer profiles — name, type, contact, credit balance, profile image |
| `Notification`     | System-generated alerts                                                |
| `NotificationRead` | Per-user read status junction table                                    |
| `AuditLog`         | Full audit trail — actor, panel, action, details, timestamp            |
| `EmailToken`       | Email verification + password reset tokens (6-digit code + secure link)|
| `RateLimit`        | DB-backed rate limiting per route/IP                                   |
| `Session`          | Auth.js sessions (managed by Auth.js)                                  |

---

## Routes

| Route              | Type     | Access        | Description                                    |
| ------------------ | -------- | ------------- | ---------------------------------------------- |
| `/login`           | Static   | Public        | Login (username/email + TOTP)                  |
| `/register`        | Static   | Public        | Registration with email verification           |
| `/forgot-password` | Static   | Public        | Password reset via email                       |
| `/dashboard`       | Dynamic  | All roles     | KPIs, revenue chart, recent transactions       |
| `/pos`             | Dynamic  | All roles     | POS Terminal with draggable cart                |
| `/inventory`       | Dynamic  | All roles     | Product CRUD, brands, suppliers, stock         |
| `/categories`      | Dynamic  | Admin+        | Hierarchical category management               |
| `/brands`          | Dynamic  | Admin+        | Brand management                               |
| `/transactions`    | Dynamic  | All roles     | Transaction log with detail modals             |
| `/orders`          | Dynamic  | All roles     | Purchase Order management with delivery        |
| `/buyers`          | Dynamic  | All roles     | Buyer profiles with profile pictures           |
| `/suppliers`       | Dynamic  | All roles     | Supplier CRUD with TIN                         |
| `/restocks`        | Dynamic  | All roles     | Restock history with cost tracking             |
| `/finance`         | Dynamic  | Admin+        | Financial KPIs, cash flow, top products        |
| `/audit-log`       | Dynamic  | Admin+        | Audit trail with user filter                   |
| `/users`           | Dynamic  | SUPERADMIN    | User management                                |
| `/settings`        | Dynamic  | All roles     | Profile, password, TOTP setup                  |
| `/notifications`   | Dynamic  | All roles     | Notification center                            |
| `/support`         | Dynamic  | All roles     | Support modal                                  |
| `/api/auth/*`      | Dynamic  | Public        | Auth.js + register/verify/reset endpoints      |
| `/api/notifications`| Dynamic | All roles     | Notification CRUD                              |
| `/api/clear-cookies`| Static  | Public        | Cookie clearing endpoint                       |

---

## RBAC (Role-Based Access Control)

| Path             | SUPERADMIN | ADMIN | STAFF |
| ---------------- | ---------- | ----- | ----- |
| `/dashboard`     | ✅         | ✅    | ✅    |
| `/pos`           | ✅         | ✅    | ✅    |
| `/inventory`     | ✅         | ✅    | ✅    |
| `/categories`    | ✅         | ✅    | ❌    |
| `/brands`        | ✅         | ✅    | ❌    |
| `/transactions`  | ✅         | ✅    | ✅    |
| `/orders`        | ✅         | ✅    | ✅    |
| `/buyers`        | ✅         | ✅    | ✅    |
| `/suppliers`     | ✅         | ✅    | ✅    |
| `/restocks`      | ✅         | ✅    | ✅    |
| `/finance`       | ✅         | ✅    | ❌    |
| `/audit-log`     | ✅         | ✅    | ❌    |
| `/users`         | SUPERADMIN | ❌    | ❌    |
| `/settings`      | ✅         | ✅    | ✅    |
| `/notifications` | ✅         | ✅    | ✅    |

---

## Build

```bash
npm run build    # TypeScript check + production build
npm run lint     # ESLint
```

---

## Roadmap

### Completed
- [x] Prisma schema (MySQL / Hostinger)
- [x] Design system & UI (Tailwind CSS 4 + shadcn/ui)
- [x] Authentication & session management (Auth.js v5)
- [x] Email verification flow
- [x] TOTP 2FA support
- [x] RBAC (SUPERADMIN / ADMIN / STAFF)
- [x] Dashboard with live KPIs & revenue chart
- [x] POS terminal (Walk-in, P.O., Return, Damage, Adjustment)
- [x] Draggable cart pane (280px–550px)
- [x] Live receipt sidebar
- [x] Credit & cheque payment support
- [x] Inventory CRUD & hierarchical categories
- [x] Brand management (independent module)
- [x] Supplier management with TIN
- [x] Transaction processing with detail modals
- [x] Purchase order management with delivery tracking
- [x] Buyer profiles with profile pictures & credit tracking
- [x] Restock history with cost price tracking
- [x] Financial KPIs (Gross Sales, Net Revenue, Returns Loss, etc.)
- [x] Audit log with user filter & profile pictures
- [x] User management (SUPERADMIN only for admin editing)
- [x] Per-user notification read status
- [x] Dark mode toggle
- [x] Skeleton loaders on all pages
- [x] CSV + XLSX export & import
- [x] DB-backed rate limiting
- [x] Input sanitization
- [x] CSP headers & cache busting
- [x] Profile pictures (Buyers, Users, Audit Logs)

### Planned
- [ ] Mobile offline-capable version (React Native + IndexedDB)
- [ ] SaaS capabilities with pricing tiers and subscription logic

---

## License

Apache 2.0 — see [APACHE_LICENSE.md](APACHE_LICENSE.md).

---

_Built by James Bryant D. Espino — [GitHub](https://github.com/Jamespino20)_
