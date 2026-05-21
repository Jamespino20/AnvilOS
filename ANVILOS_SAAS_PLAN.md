# AnvilOS SaaS Implementation Plan

> **Vision**: Transform AnvilOS from a single-tenant POS into a multi-tenant SaaS platform where tenants get branded, tier-gated business management instances, while AnvilOS remains the platform orchestrator (superadmin-only).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    anvilos.com                              │
├─────────────────────────────────────────────────────────────┤
│                        Marketing / Landing                  │
│                        /login (superadmin)                  │
│                        /register                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /{slug}/login  ──►  Tenant-branded auth gate               │
│       │                                                     │
│       ▼                                                     │
│  /{slug}/dashboard  ──►  Tenant-scoped business suite       │
│  /{slug}/pos              (RBAC-enforced, module-gated)     │
│  /{slug}/inventory                                           │
│  /{slug}/...                                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  /superadmin/dashboard  ──►  Platform operations             │
│  /superadmin/tenants         (tenant mgmt, plans, audit)    │
│  /superadmin/plans                                           │
│  /superadmin/audit                                           │
├─────────────────────────────────────────────────────────────┤
│                       Shared Layer                          │
│  Tenant Context │ RBAC Guard │ Module Gate │ Branding       │
└─────────────────────────────────────────────────────────────┘
```

### Design Decisions (ADRs)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Data Isolation** | Row-level `tenantId` | Simplest for launch, Prisma middleware auto-filters, can migrate to schema-per-tenant later for premium tiers |
| **Tenant Routing** | Path-based `/{slug}/...` | No DNS/cert infra needed, works immediately on Vercel, easy tenant-specific landing pages |
| **Auth** | NextAuth v5 (existing) + Tenant-scoped sessions | Reuse existing auth, add tenant context to JWT |
| **RBAC** | Role-Permission model (predefined roles) | Flexible but not over-engineered; roles per-tenant, system-permissions global |
| **Billing** | Stripe (ready but dormant) | Stripe Customer Portal for self-serve; no active billing until launch |
| **Platform vs Tenant** | Route group separation | Superadmin never enters tenant routes; tenant users never see `/superadmin` |

---

## Database Schema

### New Models

```prisma
/// Multi-tenant platform core
model Tenant {
  id        Int      @id @default(autoincrement())
  slug      String   @unique // e.g., "cwl-hardware"
  name      String
  status    TenantStatus @default(Active) // Active | Suspended | Trialing
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  subscription   Subscription?
  users          User[]
  roles          Role[]
  tenantModules  TenantModule[]
  branding       TenantBranding?

  // Scoped existing models
  categories     Category[]
  suppliers      Supplier[]
  products       Product[]
  transactions   Transaction[]
  notifications  Notification[]
  buyers         Buyer[]
  auditLogs      AuditLog[]

  @@map("tenants")
}

enum TenantStatus {
  Active
  Suspended
  Trialing
  @@map("tenant_status")
}

/// Subscription tier definition (NOT the tenant's subscription — that's the plan catalog)
model Plan {
  id          Int      @id @default(autoincrement())
  name        String   // "Starter", "Pro", "Enterprise"
  slug        String   @unique // "starter", "pro", "enterprise"
  description String?
  price       Decimal  @db.Decimal(10, 2) @default(0)
  isPublic    Boolean  @default(true) // visible on pricing page

  maxUsers     Int @default(1)
  maxProducts  Int @default(100)

  modules  PlanModule[] // Which modules this plan includes
  subscriptions Subscription[]

  @@map("plans")
}

/// Which modules a plan includes (plan ↔ module M:N)
model PlanModule {
  id         Int    @id @default(autoincrement())
  planId     Int
  moduleKey  String // "pos", "inventory", "restocks", "buyers", "reporting", "audit"

  plan Plan @relation(fields: [planId], references: [id])

  @@unique([planId, moduleKey])
  @@map("plan_modules")
}

/// A tenant's active subscription
model Subscription {
  id         Int      @id @default(autoincrement())
  tenantId   Int      @unique
  planId     Int
  status     SubscriptionStatus @default(Active) // Active, PastDue, Canceled, Trialing
  startDate  DateTime @default(now())
  endDate    DateTime?
  trialEnds  DateTime?

  // Stripe fields (dormant until payment starts)
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique

  tenant Tenant @relation(fields: [tenantId], references: [id])
  plan   Plan   @relation(fields: [planId], references: [id])

  @@map("subscriptions")
}

enum SubscriptionStatus {
  Active
  PastDue
  Canceled
  Trialing
  @@map("subscription_status")
}

/// Per-tenant role (predefined: Owner, Admin, Manager, Cashier, Viewer)
model Role {
  id       Int    @id @default(autoincrement())
  tenantId Int
  name     String // "Owner", "Admin", "Manager", "Cashier", "Viewer"
  isSystem Boolean @default(false) // System roles cannot be deleted

  tenant      Tenant           @relation(fields: [tenantId], references: [id])
  users       User[]
  permissions RolePermission[]

  @@unique([tenantId, name])
  @@map("roles")
}

/// Global permission catalog (seeded, not editable)
model Permission {
  id        Int    @id @default(autoincrement())
  name      String @unique // "product.create", "product.read", "transaction.create", etc.
  module    String // "products", "transactions", "users", "settings", etc.
  action    String // "create", "read", "update", "delete", "manage"

  roles RolePermission[]

  @@map("permissions")
}

/// Role ↔ Permission junction
model RolePermission {
  id           Int @id @default(autoincrement())
  roleId       Int
  permissionId Int

  role       Role       @relation(fields: [roleId], references: [id])
  permission Permission @relation(fields: [permissionId], references: [id])

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

/// Per-tenant module overrides (can enable/disable modules beyond what the plan provides)
model TenantModule {
  id        Int     @id @default(autoincrement())
  tenantId  Int
  moduleKey String // same keys as PlanModule
  isEnabled Boolean @default(true)

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, moduleKey])
  @@map("tenant_modules")
}

/// Tenant branding & homepage settings
model TenantBranding {
  id       Int    @id @default(autoincrement())
  tenantId Int    @unique

  // Branding
  logoUrl       String? // CDN URL to uploaded logo
  primaryColor  String? @default("#1e40af") // CSS hex
  secondaryColor String? @default("#f59e0b")
  customCss     String? // Raw CSS overrides

  // Homepage
  homepageTitle       String? @default("Dashboard")
  homepageSubtitle    String? @default("Welcome back")
  homepageHeroMessage String? // Custom message on tenant's landing
  homepageModules     Json?   // Which modules visible on homepage, layout config

  // Custom domain (premium)
  customDomain String? @unique
  domainVerified Boolean @default(false)

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@map("tenant_branding")
}
```

### Modified Existing Models

Every tenant-scoped model gets a `tenantId`:

| Model      | Add                               | Notes                                  |
| ---------- | --------------------------------- | -------------------------------------- |
| **User**   | `tenantId Int` + `roleId Int?` + `isSuperadmin Boolean @default(false)` | User can have both tenant + superadmin |
| **Category** | `tenantId Int` |                                        |
| **Supplier** | `tenantId Int` |                                        |
| **Product** | `tenantId Int` |                                        |
| **Transaction** | `tenantId Int` | Uses existing `sellerId` for user ref  |
| **TransactionItem** | (already has product ref) | Inherits via Transaction               |
| **Notification** | `tenantId Int` |                                        |
| **Buyer** | `tenantId Int` |                                        |
| **AuditLog** | `tenantId Int` | Also keep for superadmin platform audit |

---

## RBAC Model

### Predefined Roles (seeded per-tenant)

| Role      | Level | Typical User           |
| --------- | ----- | ---------------------- |
| **Owner** | 5     | Tenant account creator |
| **Admin** | 4     | Store manager          |
| **Manager** | 3   | Department head        |
| **Cashier** | 2   | POS operator           |
| **Viewer** | 1    | Read-only access       |

### Permission Catalog (seeded globally)

```
products:      create, read, update, delete, manage
categories:    create, read, update, delete
suppliers:     create, read, update, delete
transactions:  create, read, update, delete
restocks:      create, read, process
buyers:        create, read, update
users:         create, read, update, delete (tenant users only)
settings:      read, update
audit:         read
roles:         read, manage
branding:      read, update
subscription:  read
```

### Permission Mapping to Roles

| Module         | Owner | Admin | Manager | Cashier | Viewer |
| -------------- | :---: | :---: | :-----: | :-----: | :----: |
| products:read  | ✅    | ✅    | ✅      | ✅      | ✅     |
| products:write | ✅    | ✅    | ✅      | ❌      | ❌     |
| transact:create| ✅    | ✅    | ✅      | ✅      | ❌     |
| transact:read  | ✅    | ✅    | ✅      | ✅      | ✅     |
| users:manage   | ✅    | ✅    | ❌      | ❌      | ❌     |
| settings:write | ✅    | ✅    | ❌      | ❌      | ❌     |
| audit:read     | ✅    | ✅    | ❌      | ❌      | ❌     |
| roles:manage   | ✅    | ❌    | ❌      | ❌      | ❌     |
| branding:write | ✅    | ❌    | ❌      | ❌      | ❌     |
| subscription:read | ✅ | ✅   | ❌      | ❌      | ❌     |

### Authorization Flow

```
Request → [Tenant Context Middleware] → [Auth Guard] → [RBAC Guard] → [Module Gate] → Handler
                │                          │               │               │
                │                          │               │               └─ Does tenant's plan include this module?
                │                          │               └─ Does user's role have this permission?
                │                          └─ Is user logged in?
                └─ Extract tenantId from URL slug → attach to request context
```

---

## Module Gating & Subscription

### Module Catalog

| Module Key     | Display Name           | Starter | Pro  | Enterprise |
| -------------- | ---------------------- | :-----: | :--: | :--------: |
| `pos`          | Point of Sale          | ✅      | ✅   | ✅        |
| `inventory`    | Inventory Management   | ✅      | ✅   | ✅        |
| `restocks`     | Restock & Replenishment| ❌      | ✅   | ✅        |
| `buyers`       | Customer Management    | ❌      | ✅   | ✅        |
| `reporting`    | Advanced Reporting     | ❌      | ✅   | ✅        |
| `audit`        | Audit Trail            | ❌      | ✅   | ✅        |
| `suppliers`    | Supplier Management    | ❌      | ✅   | ✅        |
| `api-access`   | API Access             | ❌      | ❌   | ✅        |
| `multi-store`  | Multi-Store Support    | ❌      | ❌   | ✅        |
| `custom-domain`| Custom Domain          | ❌      | ❌   | ✅        |
| `branding`     | Full Branding Control  | ✅      | ✅   | ✅        |

### Plan Limits

| Limit          | Starter | Pro     | Enterprise |
| -------------- | :-----: | :-----: | :--------: |
| Max Users      | 3       | 10      | Unlimited  |
| Max Products   | 500     | 5,000   | Unlimited  |
| Max Storage    | 1 GB    | 10 GB   | 100 GB     |
| Support        | Email   | Priority | 24/7 + SLA|

### Gating Strategy

```typescript
// 1. Module Gate — does the plan include this module?
function canAccessModule(tenantId: number, moduleKey: string): boolean {
  // Check tenant-level override first
  const override = await prisma.tenantModule.findUnique({
    where: { tenantId_moduleKey: { tenantId, moduleKey } }
  });
  if (override) return override.isEnabled;

  // Check plan includes the module
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: { include: { modules: true } } }
  });
  return subscription.plan.modules.some(m => m.moduleKey === moduleKey);
}

// 2. Limiter — check usage against plan limit
function checkLimit(tenantId: number, resource: 'users' | 'products'): boolean {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true }
  });
  const currentCount = await getCount(resource, tenantId);
  return currentCount < subscription.plan[`max${capitalize(resource)}`];
}
```

---

## Route Architecture

```
src/app/
├── page.tsx                       # Marketing landing (public)
├── layout.tsx                     # Root layout (providers, fonts)
├── login/
│   └── page.tsx                   # Superadmin / platform login
├── register/
│   └── page.tsx                   # Tenant signup (create tenant + owner)
│
├── (platform)/                    # Route group — public pages (no tenant)
│   ├── contact/
│   ├── pricing/
│   ├── solutions/
│   └── marketplace/
│
├── (tenant)/                      # Route group — tenant-scoped
│   ├── layout.tsx                 # Extracts slug, loads tenant context
│   ├── [slug]/
│   │   ├── login/
│   │   │   └── page.tsx           # Tenant-branded login
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # Auth guard + RBAC + DashboardShell
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # Tenant homepage (customizable)
│   │   │   ├── pos/
│   │   │   │   ├── page.tsx
│   │   │   │   └── client.tsx
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx
│   │   │   │   └── client.tsx
│   │   │   ├── orders/
│   │   │   ├── transactions/
│   │   │   ├── restocks/
│   │   │   ├── buyers/
│   │   │   ├── suppliers/
│   │   │   ├── audit-log/
│   │   │   ├── notifications/
│   │   │   ├── settings/
│   │   │   │   └── page.tsx       # User profile + role-based settings
│   │   │   └── admin/             # Tenant admin (Owner/Admin only)
│   │   │       ├── page.tsx       # Tenant admin dashboard
│   │   │       ├── users/         # Manage tenant users
│   │   │       ├── roles/         # View role permissions
│   │   │       ├── branding/      # Logo, colors, homepage content
│   │   │       └── subscription/  # View plan, usage, downgrade
│   │   │
│   │   └── loading.tsx
│   │
│   └── layout.tsx                 # Tenant context provider
│
├── superadmin/                    # Platform operations
│   ├── login/
│   │   └── page.tsx               # (reuses /login above via redirect)
│   ├── dashboard/
│   │   └── page.tsx               # Platform-wide KPIs
│   ├── tenants/
│   │   ├── page.tsx               # List all tenants
│   │   └── [id]/
│   │       └── page.tsx           # Tenant detail (usage, plan, status)
│   ├── plans/
│   │   ├── page.tsx               # Manage plans
│   │   └── [id]/
│   │       └── page.tsx           # Edit plan modules/limits
│   ├── audit/
│   │   └── page.tsx               # Cross-tenant audit log
│   └── settings/
│       └── page.tsx               # Platform settings
│
└── api/
    ├── auth/                      # Existing auth routes
    ├── platform/                  # Superadmin API
    │   ├── tenants/
    │   ├── plans/
    │   └── stats/
    ├── tenant/                    # Tenant-scoped API
    │   └── [slug]/
    │       ├── auth/
    │       ├── branding/
    │       ├── subscription/
    │       └── admin/
    └── webhooks/
        └── stripe/                # Stripe webhooks (future)
```

---

## Implementation Phases

### Phase 0: Foundation (Weeks 1-2)

**Goal**: Prisma schema + tenant context + basic multi-tenant guardrails.

| Task | Details |
| ---- | ------- |
| **0.1** Extend Prisma schema | Add `Tenant`, `Plan`, `Subscription`, `Role`, `Permission`, `RolePermission`, `TenantModule`, `TenantBranding` models + `tenantId` on all existing models + `isSuperadmin` on User |
| **0.2** Seed data | Seed plans (Starter/Pro/Enterprise), modules, roles (Owner/Admin/Manager/Cashier/Viewer), and all permissions with role mappings |
| **0.3** Tenant context middleware | Create `getTenantFromSlug()` helper; add Prisma middleware that auto-injects `tenantId` on all queries for tenant-scoped models |
| **0.4** Tenant detection utility | Extract tenant slug from `params.slug` in route handlers; attach to request context |
| **0.5** Migration & verification | Run initial `prisma migrate dev`; verify seed script produces correct initial state |

### Phase 1: RBAC & Authorization (Weeks 3-4)

**Goal**: Full auth authorization with role/permission checks.

| Task | Details |
| ---- | ------- |
| **1.1** Enrich JWT/Session | Add `tenantId`, `roleId`, `isSuperadmin`, `permissions[]` to NextAuth JWT and session callbacks |
| **1.2** Permission helper | Create `can(permission: string)` server-side utility that checks user's permissions from session |
| **1.3** RBAC Guard component | `<RequirePermission permission="products.create">` wrapper that shows 403 or hides children |
| **1.4** API route guard | `withPermission()` middleware for API routes |
| **1.5** Server action guard | Reusable `requirePermission()` check at top of each server action |
| **1.6** UI adaptation | Sidebar shows only permitted modules; buttons/actions disabled based on role |

### Phase 2: Tenant Context & Data Isolation (Weeks 5-6)

**Goal**: All data operations are tenant-scoped; cross-tenant leakage impossible.

| Task | Details |
| ---- | ------- |
| **2.1** Prisma middleware | Global middleware that adds `where: { tenantId }` to all find/create/update/delete on tenant-scoped models |
| **2.2** Tenant slug routing | `(tenant)/[slug]/` route group with `layout.tsx` that loads tenant context (branding, subscription, modules) and provides it via React context |
| **2.3** Tenant-scoped login | `/[slug]/login` page that shows tenant's branding and only accepts users belonging to that tenant |
| **2.4** Superadmin guard | Middleware that blocks superadmins from accessing tenant routes and vice versa |
| **2.5** Data migration | Update existing server actions to use tenant context (replace no-tenant queries with scoped ones) |

### Phase 3: Module Gating & Subscription (Weeks 7-8)

**Goal**: Plans gate modules; UI hides unavailable features; limits enforced.

| Task | Details |
| ---- | ------- |
| **3.1** Module gate component | `<ModuleGate module="inventory">` that checks subscription plan + tenant overrides |
| **3.2** Plan/subscription UI | Tenant admin page showing current plan, usage (users/products), upgrade options |
| **3.3** Limit enforcement | Guards on user creation and product creation that check plan max limits |
| **3.4** Tenant module overrides | Superadmin can toggle individual modules per tenant (for trials, custom deals) |
| **3.5** Sidebar + route gating | Tenant sidebar only shows modules their plan includes; routes return 403 if module not in plan |
| **3.6** Stripe integration (dormant) | Create Stripe products/prices matching plans; integrate Stripe Checkout; webhook handler ready but not active |

### Phase 4: Tenant Branding & Customization (Weeks 9-10)

**Goal**: Each tenant has unique look, feel, and homepage content.

| Task | Details |
| ---- | ------- |
| **4.1** Branding settings UI | Tenant admin page for logo upload, color pickers, CSS overrides |
| **4.2** Dynamic CSS injection | Root layout reads tenant branding and injects CSS variables (`--primary`, `--secondary`, logo in navbar) |
| **4.3** Custom homepage | Tenant configures their dashboard homepage: which modules appear, hero message, layout |
| **4.4** Branded login page | `/[slug]/login` renders tenant logo, colors, custom message |
| **4.5** Asset upload | Logo upload API with CDN storage (Vercel Blob or S3) |
| **4.6** Custom domain (premium) | Superadmin configures custom domain for Enterprise tenants; DNS verification flow |

### Phase 5: Superadmin Platform (Weeks 11-12)

**Goal**: Full platform management console.

| Task | Details |
| ---- | ------- |
| **5.1** Superadmin dashboard | Platform-wide KPIs: total tenants, active/inactive counts, revenue (from subscriptions), top modules |
| **5.2** Tenant management | List/filter/sort tenants; click for detail view (current plan, user count, product count, status) |
| **5.3** Tenant lifecycle | Suspend/activate tenant; change plan; extend trial; add module overrides |
| **5.4** Plan management | CRUD for plans (modules, pricing, limits); plan versions |
| **5.5** Platform audit log | Cross-tenant view of all audit logs; filter by tenant, action, user |
| **5.6** Platform settings | SMTP config, global defaults, feature flags |

### Phase 6: Polish, Migration & Launch (Weeks 13-16)

**Goal**: Existing single-tenant data migrated; everything production-ready.

| Task | Details |
| ---- | ------- |
| **6.1** Migration script | Script to create a default tenant for existing data; migrate all existing users/products/transactions to the new tenant |
| **6.2** Existing user migration | All current users become members of the default tenant; superadmin flag set for the original admin |
| **6.3** Tenant signup flow | Self-service signup at `/register`: create tenant -> choose plan -> create owner account -> redirect to `/{slug}/dashboard` |
| **6.4** Onboarding wizard | First-login flow for new tenants: set up branding, invite users, add products |
| **6.5** Stripe go-live | Activate Stripe webhooks; enable Checkout; test full subscription lifecycle |
| **6.6** Testing | RBAC test matrix, data isolation verification, module gating edge cases, migration dry-run |
| **6.7** Documentation | Tenant admin guide, superadmin guide, API docs |

---

## Key Implementation Details

### Tenant Context Middleware Pattern

```typescript
// src/lib/tenant.ts
import { auth } from "./auth";
import { prisma } from "./prisma";

export async function getTenantContext(slug: string) {
  const session = await auth();
  if (!session?.user) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      branding: true,
      subscription: { include: { plan: { include: { modules: true } } } },
    },
  });

  if (!tenant) return null;

  // Verify user belongs to this tenant (or is superadmin)
  // ... or use a superadmin bypass

  return {
    tenant,
    user: session.user,
    branding: tenant.branding,
    plan: tenant.subscription?.plan,
    modules: tenant.subscription?.plan.modules.map(m => m.moduleKey) ?? [],
  };
}
```

### Prisma Middleware for Auto-Tenant Scoping

```typescript
// Applied during Prisma client initialization
prisma.$use(async (params, next) => {
  const tenantScopedModels = [
    "Category", "Supplier", "Product", "Transaction",
    "TransactionItem", "Notification", "Buyer", "AuditLog",
  ];

  if (tenantScopedModels.includes(params.model ?? "") && tenantId) {
    if (params.action === "findUnique" || params.action === "findFirst") {
      params.args.where = { ...params.args.where, tenantId };
    }
    if (params.action === "findMany") {
      params.args.where = { ...params.args.where, tenantId };
    }
    if (params.action === "create") {
      params.args.data = { ...params.args.data, tenantId };
    }
    // ... update, delete, etc.
  }

  return next(params);
});
```

### Permission Check Utility

```typescript
// src/lib/rbac.ts
export function requirePermission(permission: string) {
  return async () => {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthenticated");

    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (user?.isSuperadmin) return true; // Superadmin bypass
    if (!user?.role) throw new Error("No role assigned");

    const hasPermission = user.role.permissions.some(
      rp => rp.permission.name === permission
    );

    if (!hasPermission) throw new Error("Forbidden");
    return true;
  };
}
```

### Module Gate in Server Actions

```typescript
// src/lib/modules.ts
export function requireModule(moduleKey: string) {
  return async (tenantId: number) => {
    const sub = await prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: { include: { modules: true } } },
    });

    const hasModule = sub?.plan.modules.some(m => m.moduleKey === moduleKey);
    if (!hasModule) throw new Error(
      `Module "${moduleKey}" not in your plan. Upgrade to access this feature.`
    );
  };
}
```

---

## Risk & Mitigation

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Tenant data leakage | Critical | Prisma middleware auto-filters; integration tests verify isolation |
| Performance from tenantId index | Medium | Add composite indexes on (tenantId, id) for all tenant-scoped tables |
| Migration of existing data | High | Phase 6 dedicated to migration; dry-run before production; rollback script ready |
| Scope creep during phases | Medium | Each phase is self-contained; ship Phase 0-2 before moving to 3-4 |
| No payments yet → Stripe integration unused | Low | Build dormant Stripe integration; activate when ready; no rework needed |

---

## File Change Checklist

### New Files to Create

| File | Purpose |
| ---- | ------- |
| `prisma/migrations/` | Schema migrations (auto-generated) |
| `prisma/seed.ts` (update) | Seed tenants, plans, modules, roles, permissions |
| `src/lib/tenant.ts` | Tenant context middleware |
| `src/lib/rbac.ts` | Permission check utilities |
| `src/lib/modules.ts` | Module gating utilities |
| `src/lib/tenant-prisma.ts` | Prisma client with tenant middleware |
| `src/app/(tenant)/layout.tsx` | Tenant route group layout |
| `src/app/(tenant)/[slug]/layout.tsx` | Tenant context provider |
| `src/app/(tenant)/[slug]/login/page.tsx` | Tenant-branded login |
| `src/app/(tenant)/[slug]/(dashboard)/admin/*` | Tenant admin pages |
| `src/app/superadmin/*` | Superadmin pages |
| `src/app/api/platform/*` | Superadmin API routes |
| `src/app/api/tenant/[slug]/*` | Tenant API routes |
| `src/app/api/webhooks/stripe/route.ts` | Stripe webhook handler |
| `src/components/rbac/*` | RBGuard, ModuleGate components |
| `src/components/tenant/*` | Tenant branding components |

### Existing Files to Modify

| File | Changes |
| ---- | ------- |
| `prisma/schema.prisma` | Add new models + tenantId on existing |
| `src/lib/auth.ts` | Add tenantId, roleId, isSuperadmin to JWT/session |
| `src/lib/prisma.ts` | Add tenant-scoping middleware |
| `src/actions/index.ts` | Add tenant context + permission + module checks |
| `src/app/(dashboard)/*` | Move into `(tenant)/[slug]/(dashboard)/` |
| `src/components/dashboard-shell.tsx` | Module-gated sidebar, branded header |
| `src/components/sidebar.tsx` | Filter items by permissions + modules |
| `src/components/topbar.tsx` | Branded topbar, tenant switcher for superadmins |
| `src/components/auth/AuthModal.tsx` | Adapt for tenant context |
| `src/proxy.ts` | Update matcher for new route patterns |

---

## Summary

| Dimension | Approach |
| --------- | -------- |
| **Tenancy** | Row-level `tenantId` on all scoped tables |
| **Routing** | Path-based `/{slug}/...` with `(tenant)` route group |
| **Auth** | Tenant-specific login at `/{slug}/login`; superadmin at `/login` |
| **RBAC** | 5 roles (Owner → Viewer) with seeded permission matrix |
| **Modules** | Plan-gated module catalog; tenant-level overrides |
| **Subscription** | Stripe-ready but dormant; manual plan assignment for now |
| **Branding** | Per-tenant logo, colors, CSS, homepage content |
| **Platform** | `/superadmin/` for tenant/plan/audit management |
| **Timeline** | 16 weeks (4 months), 6 phases |
