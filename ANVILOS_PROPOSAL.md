# AnvilOS — Point-of-Sale & Inventory Management System

> **Project Proposal** for CWL Hardware
> Prepared by: Alvin M. Espino
> Date: May 21 2026

---

## 1. Executive Summary

AnvilOS is a modern, web-based Point-of-Sale (POS) and inventory management platform designed for hardware stores, retail shops, and warehouse operations. It replaces legacy desktop POS systems with a cloud-enabled solution accessible from any device with a browser.

**Core Value Proposition:**

- **Cloud-first** — No local installation, no hardware server needed
- **Real-time inventory** — Stock levels update instantly across all users
- **Mobile-ready** — Works on tablets, laptops, and desktops
- **Data-safe** — Automatic backups, encrypted connections, role-based access

---

## 2. Project Overview

| Item             | Detail                                                    |
| ---------------- | --------------------------------------------------------- |
| **Product**      | AnvilOS v1.0                                              |
| **Type**         | Web Application (SaaS-ready)                              |
| **Stack**        | Next.js 16 + TypeScript + PostgreSQL                      |
| **Hosting**      | Vercel (app) + NeonDB (database)                          |
| **Target Users** | Store staff, cashiers, inventory managers, administrators |

### Objectives

1. Enable cashiers to process customer purchases quickly via an intuitive POS interface
2. Provide real-time visibility into stock levels, low-stock alerts, and out-of-stock items
3. Streamline restock and supplier management with automated stock reconciliation
4. Offer administrative tools for user management, audit logging, and reporting
5. Deliver a professional, branded experience with customizable settings

---

## 3. Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Client)                 │
│  Next.js 16 App · Tailwind CSS 4 · shadcn/ui (Radix)│
├─────────────────────────────────────────────────────┤
│              Next.js API Routes / Server Actions    │
│         Auth.js v5 · Prisma 7.8 ORM · JWT Auth      │
├─────────────────────────────────────────────────────┤
│                PostgreSQL (NeonDB)                  │
│        Serverless · Auto-scaling · Point-in-time    │
└─────────────────────────────────────────────────────┘
```

### Why This Stack

| Component  | Choice                  | Benefit                                     |
| ---------- | ----------------------- | ------------------------------------------- |
| Framework  | Next.js 16 (App Router) | SSR, file-based routing, server actions     |
| Database   | PostgreSQL (NeonDB)     | Relational integrity, serverless, free tier |
| ORM        | Prisma 7.8              | Type-safe queries, migrations, easy schema  |
| Auth       | Auth.js v5              | Credentials + OAuth, JWT strategy           |
| UI         | Tailwind CSS 4 + Radix  | Fast styling, accessible components         |
| Deployment | Vercel + NeonDB         | Zero-config deploy, global CDN              |

---

## 4. Features & Modules

### 4.1 Point-of-Sale (POS)

| Feature             | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| Product Grid        | Searchable, filterable product catalog with photo thumbnails |
| Cart Management     | Add/remove items, adjust quantities, real-time total         |
| Payment Methods     | Cash, Card, Bank Transfer, GCash (configurable)              |
| Delivery Methods    | Walk-in, Delivery (configurable)                             |
| Receipt Generation  | HTML receipt with print/PDF export                           |
| Transaction History | Per-customer purchase records                                |

### 4.2 Inventory Management

| Feature             | Description                                      |
| ------------------- | ------------------------------------------------ |
| Product Catalog     | Full CRUD with categories, suppliers, and photos |
| Stock Tracking      | Real-time quantities, low-stock thresholds       |
| Category Hierarchy  | Parent-child categories for organized browsing   |
| Supplier Management | Vendor profiles with contact details             |
| Stock Adjustments   | Direct quantity updates with audit trail         |
| Status Indicators   | IN STOCK / LOW STOCK / OUT OF STOCK badges       |

### 4.3 Restock & Replenishment

| Feature               | Description                                       |
| --------------------- | ------------------------------------------------- |
| Create Restock Orders | Select products and quantities via POS-style cart |
| Process Restock       | One-click stock addition with audit logging       |
| Restock History       | Full log of all replenishment activities          |

### 4.4 Buyers / Customers

| Feature             | Description                           |
| ------------------- | ------------------------------------- |
| Customer Database   | Contact info, address, order history  |
| Purchase History    | All transactions linked to each buyer |
| Customer Management | Edit contact details, view activity   |

### 4.5 Transactions & Reporting

| Feature         | Description                                       |
| --------------- | ------------------------------------------------- |
| Transaction Log | Searchable, filterable list of all sales          |
| Receipt Lookup  | View and re-print any past receipt                |
| Audit Log       | Detailed change tracking with before/after values |
| CSV Export      | Download inventory, transactions, and reports     |

### 4.6 Administration

| Feature             | Description                                              |
| ------------------- | -------------------------------------------------------- |
| User Authentication | Login/register with password + security questions        |
| Role-based Access   | Admin and staff roles                                    |
| Settings Panel      | Profile, security questions, password change, 2FA toggle |
| Activity Monitoring | Session tracking, inactivity timeout                     |

### 4.7 User Interface

| Feature             | Description                                  |
| ------------------- | -------------------------------------------- |
| Dark Mode           | Toggle between light and dark themes         |
| Responsive Design   | Works on desktop and tablet                  |
| Retractable Sidebar | Collapsible navigation for more screen space |
| Notifications Panel | Real-time alerts and updates                 |
| Glassmorphism UI    | Modern frosted-glass effects and gradients   |
| Loading Skeletons   | Content-aware loading states                 |

---

## 5. Screens & Routes

| Route              | Page                   | Access        |
| ------------------ | ---------------------- | ------------- |
| `/`                | Homepage / Landing     | Public        |
| `/login`           | Login                  | Public        |
| `/register`        | Register               | Public        |
| `/forgot-password` | Password Recovery      | Public        |
| `/dashboard`       | Main Dashboard         | Authenticated |
| `/pos`             | Point-of-Sale Terminal | Authenticated |
| `/inventory`       | Inventory Management   | Authenticated |
| `/restocks`        | Restock Orders         | Authenticated |
| `/buyers`          | Customer Management    | Authenticated |
| `/transactions`    | Transaction History    | Authenticated |
| `/orders`          | Order Management       | Authenticated |
| `/suppliers`       | Supplier Management    | Authenticated |
| `/audit-log`       | Audit Trail            | Authenticated |
| `/settings`        | User Settings          | Authenticated |
| `/support`         | Support / Help         | Authenticated |
| `/notifications`   | Notifications          | Authenticated |
| `/marketplace`     | Marketplace            | Authenticated |
| `/company`         | Company Info           | Authenticated |
| `/solutions`       | Solutions Page         | Authenticated |

---

## 6. Security & Compliance

| Measure            | Implementation                                      |
| ------------------ | --------------------------------------------------- |
| Authentication     | Auth.js v5 with JWT tokens                          |
| Password Security  | Hashed passwords, security questions for recovery   |
| Session Management | 1-hour inactivity auto-logout with warning          |
| Input Validation   | Server-side validation on all actions               |
| SQL Injection      | Prevented by Prisma ORM parameterized queries       |
| XSS Protection     | React's built-in escaping, Content-Security-Policy  |
| HTTPS              | Enforced by Vercel edge network                     |
| Audit Trail        | All mutations logged with user, timestamp, and diff |

---

## 7. Implementation Timeline

| Phase                    | Duration   | Deliverables                                                        |
| ------------------------ | ---------- | ------------------------------------------------------------------- |
| **Phase 1 — Foundation** | Week 1-2   | Project setup, authentication, database schema, deployment pipeline |
| **Phase 2 — Core POS**   | Week 3-4   | POS terminal, cart, checkout flow, receipt generation               |
| **Phase 3 — Inventory**  | Week 5-6   | Product CRUD, categories, suppliers, stock management               |
| **Phase 4 — Operations** | Week 7-8   | Restocks, buyers, transactions, orders                              |
| **Phase 5 — Admin & UX** | Week 9-10  | Dashboard, audit log, settings, dark mode, responsive polish        |
| **Phase 6 — Launch**     | Week 11-12 | Testing, data migration, training, go-live                          |

---

## 8. Pricing

> _Pricing is estimated and negotiable based on scope and deployment requirements._

### Setup & Development

| Item                                  | Cost     |
| ------------------------------------- | -------- |
| Base System (POS + Inventory + Core)  | [Amount] |
| Custom Branding & Theme               | [Amount] |
| Data Migration (from existing system) | [Amount] |
| Staff Training Session (per session)  | [Amount] |

### Monthly Hosting

| Service                 | Estimated Cost |
| ----------------------- | -------------- |
| Vercel Hosting (Pro)    | $20/month      |
| NeonDB Database (Scale) | $19/month      |
| Domain & SSL            | Included       |
| **Total Monthly**       | **~$39/month** |

### Support & Maintenance

| Plan     | Coverage                                              | Price          |
| -------- | ----------------------------------------------------- | -------------- |
| Basic    | Email support, bug fixes, 8 business hours            | [Amount]/month |
| Standard | Email + phone, bug fixes, 4-hour response             | [Amount]/month |
| Premium  | 24/7 support, priority fixes, monthly feature updates | [Amount]/month |

---

## 9. Support & Maintenance

- **Hosting & Infrastructure**: Managed by Vercel + NeonDB (99.9% uptime SLA)
- **Backups**: Automated daily database backups with point-in-time recovery
- **Updates**: Security patches and platform updates included
- **Add-ons**: Additional modules (advanced reporting, barcode scanning, multi-store) available on request

---

## 10. Next Steps

1. **Review & Feedback** — Client reviews proposal and requests adjustments
2. **Scope Finalization** — Confirm feature set, timeline, and pricing
3. **Onboarding** — Gather existing data, brand assets, and access requirements
4. **Development Kickoff** — Begin Phase 1, with weekly progress updates
5. **Training & Deployment** — Staff training followed by production launch

---

_This proposal is valid for 30 days from the date above. Specifications subject to change based on final scope agreement._

**[Client Name]** \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\*** **Date** **\*\***\_\_\_**\*\***

**AnvilOS Representative** \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\*** **Date** **\*\***\_\_\_**\*\***
