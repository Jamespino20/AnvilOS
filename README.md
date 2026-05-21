# AnvilOS

> **From college thesis to production SaaS.** AnvilOS (formerly HardwareHub) is a web-based Point of Sale (POS), Inventory Management, and Supplier Management platform built for hardware stores and industrial supply businesses.

**Tech Stack:** Next.js 16.2.6 (App Router) · Prisma 7.8.0 · PostgreSQL (NeonDB, `pg` adapter) · Tailwind CSS 4 · TypeScript · Radix UI (shadcn/ui radix-sera preset) · Auth.js v5 (Credentials, JWT)

---

## Project Structure

```
AnvilOS/
├── prisma/
│   ├── schema.prisma          # 8 models + enums (User, Category, Supplier, Product, Transaction, TransactionItem, Notification, AuditLog)
│   └── seed.ts                # Database seeder
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Authenticated app layout with sidebar + topbar
│   │   │   ├── audit-log/     # Audit trail viewer (search, panel filter, date range, expandable delta)
│   │   │   ├── buyers/        # Buyer profiles, transaction history, edit contact info
│   │   │   ├── company/       # Company info page
│   │   │   ├── dashboard/     # KPI cards, 7-day revenue chart, recent transactions, CSV export
│   │   │   ├── inventory/     # Product CRUD, category management (parent-child), stock status filters
│   │   │   ├── marketplace/   # Marketplace page
│   │   │   ├── notifications/ # Redirects to dashboard (modal-driven from topbar)
│   │   │   ├── orders/        # Purchase Orders (SalePO) — edit items, complete/cancel
│   │   │   ├── pos/           # POS Terminal — txn type, payment/delivery method, buyer combobox, restock mode
│   │   │   ├── restocks/      # Restock history viewer
│   │   │   ├── settings/      # Profile editing, dark mode toggle
│   │   │   ├── solutions/     # Solutions page
│   │   │   ├── suppliers/     # Supplier CRUD with availability toggle
│   │   │   ├── support/       # Redirects to dashboard (modal-driven from topbar)
│   │   │   └── transactions/  # Searchable transaction log with inline status changes, pagination
│   │   ├── api/auth/          # NextAuth v5 route handlers + register/reset-password/security-questions endpoints
│   │   ├── login/             # Standalone login page
│   │   ├── register/          # Standalone registration page
│   │   ├── forgot-password/   # Password reset flow
│   │   ├── page.tsx           # Landing page (Navbar, Hero, Stats, Features, Pricing, FAQ, CTA)
│   │   └── globals.css        # Tailwind v4 + shadcn/ui theme variables
│   ├── actions/
│   │   └── index.ts           # Server actions (products, categories, suppliers, transactions, buyers, audit logs, dashboard KPIs)
│   ├── components/
│   │   ├── auth/              # AuthModal (custom overlay), LoginForm, RegisterForm
│   │   ├── ui/                # shadcn/ui primitives (dialog, input, button, tabs, select, skeleton, etc.)
│   │   │   ├── confirm-modal.tsx   # Reusable confirm dialog (danger/warning)
│   │   │   ├── skeleton.tsx        # Skeleton loaders (TableSkeleton, CardSkeleton)
│   │   │   └── page-header.tsx     # Title + subtitle component
│   │   ├── sidebar.tsx        # Collapsible sidebar with grouped nav items
│   │   ├── topbar.tsx         # Top bar with notification/settings/support modals
│   │   ├── dashboard-shell.tsx    # Client layout wrapper (sidebar state, inactivity guard)
│   │   ├── inactivity-guard.tsx   # 1-hour inactivity timeout with warning modal
│   │   ├── notification-modal.tsx # Notifications overlay modal
│   │   ├── settings-modal.tsx     # Settings overlay modal (profile + dark mode)
│   │   ├── support-modal.tsx      # Support overlay modal
│   │   ├── dashboard-export.tsx   # Dashboard CSV export client component
│   │   ├── export-button.tsx      # Generic CSV export button
│   │   └── Navbar.tsx         # Landing page navbar (sign in/register buttons)
│   ├── lib/
│   │   ├── auth.ts            # Auth.js v5 config (credentials provider, JWT callbacks)
│   │   ├── prisma.ts          # Singleton Prisma client
│   │   ├── audit.ts           # Audit logging helper
│   │   ├── csv.ts             # CSV export utility
│   │   └── utils.ts           # Tailwind cn() helper
│   └── middleware.ts          # Auth middleware for dashboard routes
├── public/images/
│   ├── anvilos_landscapelogo.png
│   └── anvilos_logomark.png
├── anvilos-desktop/           # Legacy Java Swing desktop app (reference only)
├── .env.example
├── package.json
├── tsconfig.json
└── next.config.ts
```

## Routes (25 total)

| Route              | Type    | Description                             |
| ------------------ | ------- | --------------------------------------- |
| `/`                | Static  | Landing page                            |
| `/login`           | Static  | Standalone login                        |
| `/register`        | Static  | Standalone registration                 |
| `/forgot-password` | Static  | Password reset                          |
| `/dashboard`       | Dynamic | KPI cards, revenue chart, export        |
| `/pos`             | Dynamic | POS Terminal with full cart flow        |
| `/inventory`       | Dynamic | Product CRUD + category management      |
| `/transactions`    | Dynamic | Transaction log with inline actions     |
| `/orders`          | Dynamic | Purchase Order management               |
| `/buyers`          | Dynamic | Buyer profiles & history                |
| `/suppliers`       | Dynamic | Supplier CRUD                           |
| `/restocks`        | Dynamic | Restock history with cart flow          |
| `/audit-log`       | Dynamic | Audit trail with delta expand           |
| `/settings`        | Dynamic | Profile & appearance settings           |
| `/notifications`   | Dynamic | Redirects to dashboard                  |
| `/support`         | Dynamic | Redirects to dashboard                  |
| `/company`         | Dynamic | Company info                            |
| `/marketplace`     | Dynamic | Marketplace                             |
| `/solutions`       | Dynamic | Solutions                               |
| `/api/auth/*`      | Dynamic | Auth.js v5 route handlers + custom APIs |

## Features

- **POS Terminal** — Sale (Walk-in / P.O.), Return, Damage, Adjustment with payment method (Cash/Card/GCash/Credit) and delivery method (Walk-in/Pickup/Delivery/COD) selectors. Recurring-buyer autocomplete with address/contact fill.
- **Inventory Management** — Product CRUD, hierarchical categories (parent-child with indentation), low-stock/out-of-stock badges, supplier availability filtering.
- **Supplier Management** — Vendor profiles, contact info, active/inactive toggle, connected product counts.
- **Purchase Orders** — Manage SalePO transactions, edit line items with product name+ID dropdowns, qty labels, read-only prices.
- **Buyers** — Buyer list with order count and total spent, detail view with transaction history, edit contact/address info.
- **Transaction History** — Searchable, filterable by type/status, pagination (15/page), inline Complete/Cancel for Ongoing orders, expandable line items with product names.
- **Restocks** — Dedicated restock history page with expandable item details. Restock mode hides prices, shows out-of-stock products, auto-sets buyer to company name.
- **Audit Logs** — Immutable activity trail, search/panel/date-range filters, expandable rows with before/after delta parsing (`→` pattern detection), timestamp includes seconds.
- **Dashboard** — Daily gross sales, transaction count, active products, low-stock alerts, 7-day revenue bar chart, CSV export (dashboard + transactions).
- **User Management** — Auth.js v5 credentials provider, JWT strategy, username/email login, registration with optional security questions, session inactivity guard (1-hour timeout with warning modal).
- **UI/UX** — Retractable sidebar with collapsible groups (Overview, Commerce, Stock, Monitoring), overlay modals for notifications/settings/support (no page navigation), dark mode toggle (persisted to localStorage), PageHeader subtitles on every module, skeleton loaders on all pages.
- **Security** — Full audit trail on all CRUD operations, `sslmode=verify-full` for database connections, middleware-protected dashboard routes.

## Database Schema (8 models)

| Model             | Purpose                                                                              |
| ----------------- | ------------------------------------------------------------------------------------ |
| `User`            | System users — sellerName, username (unique), email, 3 security Q&A pairs            |
| `Category`        | Hierarchical product categories (self-referencing via parentCategoryId)              |
| `Supplier`        | Vendor/supplier contact & availability tracking                                      |
| `Product`         | Inventory items — pricing, quantities, min thresholds, linked to category & supplier |
| `Transaction`     | Sales, returns, restocks, adjustments, damages — includes payment/delivery method    |
| `TransactionItem` | Line items within each transaction (productId, qty, unitPrice, totalPrice)           |
| `Notification`    | System-generated stock alerts & messages                                             |
| `AuditLog`        | Full audit trail — panel, action, details, success status, timestamp                 |

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Jamespino20/AnvilOS.git

# Install dependencies
npm install

# Set up your environment
cp .env.example .env
# Edit .env with your NeonDB connection string (ANVILOS_DATABASE_URL)

# Push schema & seed
npx prisma db push
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

| Variable               | Description                                 |
| ---------------------- | ------------------------------------------- |
| `ANVILOS_DATABASE_URL` | PostgreSQL connection (sslmode=verify-full) |
| `AUTH_SECRET`          | Auth.js encryption secret                   |
| `NEXT_PUBLIC_API_URL`  | Public API base URL                         |

## Build

```bash
npm run build    # TypeScript check + production build
npm run lint     # ESLint
```

## Roadmap

- [x] Prisma schema (NeonDB / PostgreSQL)
- [x] Design system & UI (Tailwind CSS 4 + shadcn/ui)
- [x] Authentication & session management (Auth.js v5)
- [x] Dashboard with live KPIs & revenue chart
- [x] POS terminal (Walk-in, P.O., Return, Restock, Damage, Adjustment)
- [x] Inventory CRUD & hierarchical categories
- [x] Supplier management
- [x] Transaction processing & inline status management
- [x] Purchase order management
- [x] Buyer profiles & transaction history
- [x] Restock history viewer
- [x] Audit log viewer with before/after delta
- [x] Notifications, settings, support overlay modals
- [x] Dark mode toggle
- [x] Skeleton loaders on all pages
- [x] CSV export (dashboard, transactions)
- [ ] Mobile offline-capable version (React Native + IndexedDB)
- [ ] SaaS capabilities with pricing tiers and subscription logic

## License

Apache 2.0 — see [APACHE_LICENSE.md](APACHE_LICENSE.md).

---

_Built by James Bryant D. Espino — [GitHub](https://github.com/Jamespino20)_
