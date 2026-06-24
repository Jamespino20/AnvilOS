## Goal

- Port Java desktop POS/inventory system (HardwareHub → AnvilOS) to Next.js web app on Vercel + NeonDB; resolve all remaining issues before SaaS transition

## Constraints & Preferences

- Next.js 16.2.6 (App Router) + Prisma 7.8.0 + MySQL (Hostinger) + Tailwind CSS 4 + TypeScript + shadcn/ui (radix-sera preset)
- Auth.js v5 (credentials provider, JWT strategy)
- Custom theme: #0e212c blue, #fd761a orange, 4px radius
- File header comment block required on every source file
- No emojis in source files unless explicitly requested
- **Hostinger MySQL**: `max_connections_per_hour: 500`. Default pool (10 conns, 60s idle) is fine. No URL params — MariaDB driver uses ms, not seconds.

## Progress

### Done

- **Error 494 root cause fixed**: JWT was 224KB because `token.imageUrl = user.imageUrl` stored base64 profile photo in JWT. Removed `imageUrl` from JWT — session callback fetches via `prisma.user.findUnique()` (fast PK lookup). JWT now ~400 bytes, no chunking.
- **Three-layer accumulated cookie clearing**: (1) `src/app/api/clear-cookies/route.ts` — GET endpoint not behind middleware. (2) Login page fetches it on mount. (3) `src/proxy.ts` wraps `auth()` to send clearing headers on every protected request.
- **auth.ts**: Removed custom cookies config — relies on Auth.js v5 stable defaults. Now supports login via username or email, dual-password hashing (current + legacy), and optional TOTP code verification with -1/0/+1 window drift.
- **RBAC (ADMIN / STAFF)**: `src/lib/access.ts` — `STAFF_PATHS` = `/dashboard`, `/pos`, `/categories`, `/transactions`, `/inventory`. `canAccessPath()` checks via middleware (`src/proxy.ts`); ADMIN has full access. Staff write paths blocked server-side via `isAdminRole()` guards in actions.
- **TOTP support**: `src/lib/totp.ts` — RFC-compliant TOTP (SHA1, 30s step, 6 digits, `-1/0/+1` drift). `src/app/settings/page.tsx` has setup/disable actions. Login page prompts for authenticator code when `totpEnabled = true`.
- **Email verification flow** (replaced security questions): `EmailToken` model with purpose (EmailVerification/PasswordReset), tokenHash + codeHash + expiry. `issueEmailToken()` issues 6-digit code + secure link. Register sends email, user is created `isActive: false` until verification. Password reset uses same flow with expiring token links.
- **Notifications API**: `src/app/api/notifications/route.ts` — GET/POST, `[id]/read/route.ts` — mark read, `read-all/route.ts`. `src/app/(dashboard)/notifications/page.tsx` for user-facing UI.
- **Legacy security-question routes return 410**: `security-questions/route.ts` and `verify-answers/route.ts`.
- **Action fingerprints**: `actionFingerprint(session)` returns `Name [ROLE #id]` format; appended to audit details and receipt emails.
- **Categories page** — Rewritten to inventory layout (search toolbar with Export/Import/Add, table without isAvailable column, pagination).
- **Suppliers page** — Delete button for zero-product suppliers. No isAvailable column. Export → Import → Add order.
- **Inventory toolbar** — Shortened placeholder text, uniform h-10 elements, no grid/max-width conflicts.
- **ImportButton component** — CSV+XLSX import via xlsx package. Button text "Import".
- **ExportDialog** — Trigger button `h-10` for consistent height.
- **Orders page** — Inventory-style toolbar, delivery badges, tracking timeline (Placed → Processing → On the Way → Completed). `deliveryRef`, `deliveryNotes`, `delivererName` fields via server actions. Deliverer autocomplete via `getDeliverers()`. Product name display uses `displayName(item)` (productName from TransactionItem first, fallback to Product lookup). OnTheWay disables all item quantity/remove controls.
- **Transactions page** — Inventory-style toolbar: search left, date pills + type/status dropdowns + Export/Import right. Reference receipt label for damage/adjustment.
- **Buyers page** — Inventory-style toolbar. All / Walk-In / P.O. tabs. `getBuyers(type?)` supports optional type filter.
- **POS live receipt sidebar** — Real-time receipt preview in cart sidebar. Auto-opens via `downloadReceipt()` after checkout. Category dropdown `flex-1`. Address/number/email stacked vertically. **Return auto-population**: `getReturnTransaction(receiptNumber)` fetches original items; cart defaults `quantity = 0`, stores `originalQty` for reference. Quantity capped to `originalQty` for returns. Zero-qty items filtered at checkout. **Damage/Adjustment receipt reference**: shows "Reference Receipt #" input.
- **Low stock email after POS** — `checkAndAlertLowStock()` called fire-and-forget.
- **Audit Logs page** — Inventory-style toolbar with search, Panel dropdown, date range, Export/Import, ImportButton, TableSkeleton.
- **Restocks page** — Inventory-style toolbar, `grid-cols-3` product grid in `max-w-6xl` modal (up from `max-w-3xl`/`grid-cols-2`). Cost price input per cart item with item-level `costPrice` stored in TransactionItem. Grand total = sum of `costPrice * qty`.
- **Financial KPIs** — Renamed: Gross Sales, Gross Revenue, Net Revenue. Removed Profit/Loss. Separate Restocks Cost and Damages Loss cards. Payment method breakdown filters to `SaleWalkIn`+`SalePO` only. Damages included as expense in cash flow trend. Restock cost calculated from `costPrice * quantity` per item.
- **Dashboard** — `dailySales` filtered to `SaleWalkIn`/`SalePO` only (was including all completed transactions). No ₱ sign in KPI cards or recent transactions. Prices show two decimal places.
- **Password hash split** — `oldPasswordHash` field on User model. Login checks `passwordHash` first, falls back to `oldPasswordHash`. `updatePassword` saves old hash before setting new one.
- **Cache-busting** — `next.config.ts`: `Cache-Control: no-cache, no-store, must-revalidate` + `Pragma: no-cache` + `Expires: 0` on all routes. Root layout: `<meta httpEquiv>` equivalents.
- **PDF / Receipt fixes**:
  - Logo aspect ratio maintained via `Image` element (`naturalWidth/naturalHeight`)
  - Column widths: multiplier 3x, min 20mm, max 80mm
  - Removed `cellWidth: "auto"` and `overflow: "linebreak"` from styles (conflicted with per-column widths)
  - Report-only ₱ formatting (exports apply centrally)
  - Smaller adaptive table typography, white logo badge
- **Price formatting** — All prices use `toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })`. ₱ removed from all module UI, email, and audit display; ₱ only appears in centralized report/export formatting.
- **Dark mode** — Improved initialization and toaster theme syncing.

### Done

- **Profile pictures** — Buyer, User, and Audit Log models support profile images. Buyers page has image upload in edit modal. Users table shows profile pictures. Audit Log modal shows user profile pictures.
- **Superadmin role** — `SUPERADMIN` added to UserRole enum. `isSuperAdminRole()` in access.ts. Users page restricts admin operations: only SUPERADMIN can edit ADMIN users. Server-side guards in updateUser/deleteUser actions.
- **POS brand name in receipt** — Receipt items include brand name in parentheses when available.
- **Draggable cart pane** — POS cart pane has drag handle on left edge for resizing. Width constrained between 280px-550px.
- **POS grid sizing** — Product grid has `min-w-0` for proper flex behavior across screen sizes.

### Done (June 24, 2026 — Batch Fix Session)

#### Purchase Orders Module
- **Edit order line items fixed** — Changed `getProducts({ status: "available" })` to `getProducts()` in orders page so all products (including unavailable) appear in the edit dropdown. Previously, products that were later made unavailable showed "Select product" because they were filtered out.
- **Edit order totalPrice bug fixed** — `totalPrice` was using `prod.unitPrice` (cost price) instead of `prod.sellingPrice` when selecting a new product in the edit form.
- **Edit order form converted to modal** — Replaced inline expandable panel with a fixed modal overlay (z-50, backdrop blur, max-h-[85vh] scrollable). Matches the expanded detail modal pattern.
- **Credit details added to edit order** — New `editIsCredit` and `editCreditDueDate` state variables. Modal includes Credit Details section with checkbox, due date input, and paid status display.
- **`updateTransaction` accepts credit fields** — Server action now accepts `isCredit` and `creditDueDate` parameters and persists them.

#### POS Module
- **SalePO receipts deferred** — Receipt PDF download skipped for SalePO at checkout. Toast notification only. Receipt generates when PO is completed via the Orders page.
- **Transaction type switch preserves cart** — Removed `setCart([])` from the transaction type dropdown onChange handler. Cart items persist when switching between SaleWalkIn, SalePO, Return, Damage, Adjustment.
- **Duplicate invoice number prevention** — Server-side check in `createTransaction` queries for existing `invoiceNumber` before creating a new transaction. Throws descriptive error with the conflicting receipt number.
- **Product prices serialization fixed** — POS page now maps products with `Number(p.sellingPrice)` and `Number(p.unitPrice)` before passing to client component. Prisma `Decimal` objects were not serializing correctly through the server-to-client boundary, causing prices to display as zero.
- **PO stock reservation in POS grid** — New `getPendingPOQuantities()` server action sums quantities of items on active SalePOs (Ongoing/Processing/OnTheWay). POS grid filters products by `effectiveQty = quantity - pendingPO`. Cart max quantity capped at effectiveQty. Product cards show effective quantity with actual quantity in parentheses when reserved.
- **Add/Edit product category/brand reverted to `<select>`** — Category, Brand, and Supplier fields in Add/Edit product modals changed back to `<select>` dropdowns (were `<input>` + `<datalist>`). Server-side `resolveProductCategory`, `resolveProductBrand`, `resolveProductSupplier` functions remain as fallback.

#### Finance Module
- **Philippine timezone sync** — Added `parseLocalDate()` helper in finance page that creates Date objects in local timezone instead of UTC. Added `toPH()` helper in `getCashFlowTrend` that converts UTC Date to Philippine time (UTC+8) components. All four grouping modes (hourly, daily, weekly, monthly) now use Philippine time for keys and labels. Previously, `new Date("2026-06-24")` parsed as UTC midnight, causing off-by-one day errors in UTC+8.
- **Chart flexibility** — Chart already supports hourly (today), daily, weekly, and monthly grouping based on period selection. No additional changes needed.

#### Restocks Module
- **Persistent zero in cost price input fixed** — `costPrice` type changed from `number` to `number | string` in cart state. Initialized as `""` instead of `0`. Input stores raw string value. `Number()` conversion applied on submit and display. Clearing the input now shows empty field instead of snapping back to zero.

#### Exports Module
- **Logo showing black fixed** — PNG with transparent alpha channel was rendering as solid black in jsPDF. Both `csv.ts` and `receipt.ts` now draw the logo onto a white canvas (`ctx.fillStyle = "#ffffff"`) and export as JPEG (`canvas.toDataURL("image/jpeg", 0.95)`) before passing to `doc.addImage()`. This strips the alpha channel that jsPDF's PNG decoder couldn't handle.

#### Notifications Module
- **Notification deletion** — New `deleteNotification(id)` server action with admin guard. New DELETE endpoint at `/api/notifications?id=X`. Notifications page now shows a Trash2 icon button per notification. `handleDelete` calls DELETE API and removes from local state.

#### Buyers Module
- **Cancelled POs excluded from totalSpent** — `getBuyers` legacy query now filters `transactionStatus: { not: "Cancelled" }`.
- **Return transactions decrement totalSpent** — Buyer upsert in `createTransaction` now checks `transactionType`: Returns use `{ decrement: grandTotal }`, Damage/Adjustment skip totalSpent update entirely.
- **Return cancellation reverses decrement** — `updateTransactionStatus` increments totalSpent back when a Return is cancelled.
- **SalePO totalSpent deferred to completion** — SalePO creation no longer increments totalSpent. `updateTransactionStatus` increments totalSpent when SalePO reaches "Completed" status. SalePO cancellation no longer decrements totalSpent (since it was never incremented).

#### Audit Logging Module
- **Similar events grouped** — Batch flush now groups entries by `(panel, action, sellerId)`. Multiple similar entries within the 500ms batch window are merged into a single AuditLog row with `(×N)` suffix in the action field. All entries (with or without old/new values) are now batched.

#### Inventory Module
- **Out-of-stock products visible** — Changed `getProducts({ status: "available" })` to `getProducts()` in inventory page. Products with `quantity = 0` or `isAvailable = false` now appear in the inventory list. The "Out of Stock" status filter in the client component now works correctly.

### Blocked

- (none)

## Key Decisions

- **imageUrl excluded from JWT** — base64 photos too large. Fetched from DB in session callback.
- **No custom cookies config** in auth.ts — rely on Auth.js v5 stable defaults.
- **RBAC enforced at middleware + server action level** — middleware redirects, actions use `isAdminRole(session)` guard.
- **Staff default role** on registration (`role: "STAFF"`) — only ADMIN promotes via settings.
- **Email verification** required for new accounts (`isActive: false` until verified).
- **TOTP optional** — per-user toggle in settings; login prompts only when `totpEnabled = true`.
- **Return cart defaults `quantity = 0`** — shows original qty as reference but requires explicit input.
- **Restock cost via `costPrice`** — separate from `unitPrice`; enables accurate financial reporting.
- **Payment breakdown excludes non-sales** — returns/damages/adjustments don't inflate method totals.
- **₱ removed from all UI** — only applied centrally in report/export formatting for consistency.
- **Cache headers** prevent stale page data across sessions.
- **SUPERADMIN role** — Only SUPERADMIN can edit ADMIN users. Admins cannot affect other admins. `isAdminRole()` includes SUPERADMIN. All `isAdmin` checks in UI (inventory, categories, brands) use `isAdminRole()` or equivalent to ensure SUPERADMIN has full admin access.
- **Draggable cart pane** — Width constrained 280px-550px via mouse drag on left edge handle.
- **Mobile responsiveness** — Settings sidebar horizontal tabs on mobile, POS/Restocks cart buttons 40px touch targets, Orders/Buyers/Restocks card grids responsive, Notifications header wraps, Categories expand toggle 40px, overflowX: clip on html/body/shell.
- **PWA** — manifest.ts, service worker (sw.js), registration component. App installable on mobile.
- **User cache** — In-memory 5-minute cache for session callback (avoids DB hit on every request). Cache invalidated on profile/role/TOTP changes.
- **Connection pool** — MariaDB pool params in DATABASE_URL: `connectionLimit=3&idleTimeout=120&acquireTimeout=10`. Prevents max_connections_per_hour exhaustion.

## Next Steps

- Deploy and verify Hostinger pool stability

## Relevant Files

- `prisma/schema.prisma`: MySQL provider, UserRole enum (SUPERADMIN, ADMIN, STAFF), User (role, totpSecret, totpEnabled, emailVerified, notif\*, imageUrl), Buyer (imageUrl), EmailToken model, delivery fields, costPrice, oldPasswordHash
- `src/lib/prisma.ts`: Standard Prisma Client instantiation (no adapter)
- `src/lib/auth.ts`: JWT fix, dual-password hash, TOTP verification, username/email login
- `src/lib/access.ts`: `canAccessPath()`, `isAdminRole()`, `isSuperAdminRole()`, `actionFingerprint()`, STAFF_PATHS
- `src/lib/totp.ts`: `createTotpSecret()`, `generateTotp()`, `verifyTotp()` (SHA1, -1/0/+1 drift)
- `src/lib/email-token.ts`: `issueEmailToken()`, `consumeEmailToken()`
- `src/lib/mail.ts`: `sendMail()` helper
- `src/proxy.ts`: Middleware — auth guard + RBAC redirect + accumulated cookie clearing
- `src/app/api/auth/register/route.ts`: Staff registration, sends email verification
- `src/app/api/auth/verify-email/route.ts`: Code + token verification
- `src/app/api/auth/request-password-reset/route.ts`: Email code + link flow
- `src/app/api/auth/reset-password/route.ts`: Token-verified password reset
- `src/app/api/auth/security-questions/route.ts`: 410 Gone
- `src/app/api/auth/verify-answers/route.ts`: 410 Gone
- `src/app/api/notifications/route.ts`: GET/POST notifications
- `src/app/api/notifications/[id]/read/route.ts`: Mark notification read
- `src/app/api/notifications/read-all/route.ts`: Mark all read
- `src/app/api/clear-cookies/route.ts`: Cookie clearing endpoint
- `src/app/api/cron/daily-sales/route.ts`: Daily sales report cron
- `src/actions/index.ts`: getBuyers(type?), getDeliverers(), getReturnTransaction(), updatePassword (saves old hash), getFinancialDashboard (updated KPIs), createTransaction (accepts costPrice), updateTransactionStatus (deliveryData), many isAdminRole guards, updateUser/deleteUser (SUPERADMIN checks)
- `src/actions/email.ts`: checkAndAlertLowStock(), actionFingerprint in audit
- `src/lib/csv.ts`: exportPDF — logo aspect ratio, column widths (3x, 20-80mm), no cellWidth:auto
- `src/lib/receipt.ts`: downloadReceiptPdf — logo aspect ratio, brand name in items
- `src/app/(dashboard)/dashboard/page.tsx`: No ₱, two decimal places, dailySales filtered
- `src/app/(dashboard)/finance/page.tsx`: Updated KPIs, no Profit/Loss, separate restocks/damages
- `src/app/(dashboard)/orders/page.tsx`: displayName(), deliveryRef/deliveryNotes/delivererName, OnTheWay disables items
- `src/app/(dashboard)/pos/client.tsx`: Return auto-population (qty=0, originalQty display), damage/adjustment receipt ref, draggable cart pane, brand name in receipt
- `src/app/(dashboard)/restocks/page.tsx`: max-w-6xl, grid-cols-3, costPrice input
- `src/app/(dashboard)/settings/page.tsx`: RBAC role toggles, TOTP setup/disable
- `src/app/(auth)/login/page.tsx`: TOTP code input, clear-cookies on mount
- `src/app/(auth)/register/page.tsx`: Email verification flow
- `src/app/(auth)/forgot-password/page.tsx`: Email code + token reset
- `src/app/(dashboard)/notifications/page.tsx`: Notification UI
- `src/app/(dashboard)/users/client.tsx`: Profile pictures, SUPERADMIN role support
- `src/app/(dashboard)/buyers/page.tsx`: Profile pictures, image upload
- `src/app/(dashboard)/audit-log/page.tsx`: Profile pictures in table and modal
- `src/components/dashboard-export.tsx`: No ₱ in values
