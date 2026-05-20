# AnvilOS

> **From college thesis to production SaaS.** AnvilOS (formerly HardwareHub) is a web-based Point of Sale (POS), Inventory Management, and Supplier Management platform built for hardware stores and industrial supply businesses.

**Tech Stack:** Next.js 15 (App Router) · Prisma 6 · PostgreSQL (NeonDB) · Tailwind CSS 4 · TypeScript · Radix UI

---

## Project Structure

```
AnvilOS/
├── anvilos-web/          # Next.js web application (Vercel-ready)
│   ├── prisma/           # Database schema & seed
│   │   ├── schema.prisma # Prisma schema (8 models + 3 enums)
│   │   └── seed.ts       # Database seeder
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   ├── components/   # UI components
│   │   └── lib/          # Shared utilities (prisma client, helpers)
│   ├── public/           # Static assets
│   ├── package.json
│   └── tsconfig.json
├── STITCH_MOCKUPS/       # Stitch UI mockups for all modules
├── APACHE_LICENSE.md
└── TERMS OF USE.md
```

## Database Schema (8 models)

| Model | Purpose |
|---|---|
| `User` | System users with role-based auth & security questions |
| `Category` | Hierarchical product categories (self-referencing) |
| `Supplier` | Vendor/supplier contact & availability tracking |
| `Product` | Inventory items with pricing, quantities, min thresholds |
| `Transaction` | Sales, returns, restocks, adjustments, damages |
| `TransactionItem` | Line items within each transaction |
| `Notification` | System-generated stock alerts & messages |
| `AuditLog` | Full audit trail of user actions |

## Features

- **POS Terminal** — Walk-in & purchase order sales with receipt generation
- **Inventory Management** — Real-time tracking, low-stock alerts, adjustments
- **Supplier Management** — Vendor profiles, contact info, purchase orders
- **Transaction History** — Searchable transaction log with return processing
- **Audit Logs** — Immutable activity trail for every user action
- **Dashboard** — Daily sales KPIs, revenue trends, system notifications
- **User Management** — Role-based access, security questions, login tracking

## Roadmap

- [x] Prisma schema (NeonDB / PostgreSQL)
- [x] Design system & UI mockups (Stitch)
- [ ] Authentication & session management
- [ ] REST API routes (Next.js Route Handlers)
- [ ] Dashboard with live metrics
- [ ] POS terminal interface
- [ ] Inventory CRUD & stock management
- [ ] Supplier management
- [ ] Transaction processing & returns
- [ ] Audit log viewer
- [ ] Mobile offline-capable version (IndexedDB)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Jamespino20/AnvilOS.git
cd AnvilOS/anvilos-web

# Install dependencies
npm install

# Set up your environment
cp .env.example .env
# Edit .env with your NeonDB connection string

# Push schema & seed
npx prisma db push
npm run db:seed

# Start development server
npm run dev
```

## License

Apache 2.0 — see [APACHE_LICENSE.md](APACHE_LICENSE.md).
