## Goal
- Port Java desktop POS/inventory system (HardwareHub → AnvilOS) to Next.js web app on Vercel + NeonDB; resolve all remaining issues before SaaS transition

## Constraints & Preferences
- Next.js 16.2.6 (App Router) + Prisma 7.8.0 + PostgreSQL (NeonDB) + Tailwind CSS 4 + TypeScript + shadcn/ui (radix-sera preset)
- Auth.js v5 (credentials provider, JWT strategy); `@prisma/adapter-pg` for Prisma v7 client engine
- Custom theme: #0e212c blue, #fd761a orange, 4px radius
- File header comment block required on every source file
- No emojis in source files unless explicitly requested
- `StocksX/` directory (Laravel + Filament PHP) kept in-repo as reference

## Progress
### Done
- **Error 494 root cause fixed**: JWT was 224KB because `token.imageUrl = user.imageUrl` stored base64 profile photo in JWT. Removed `imageUrl` from JWT — session callback fetches via `prisma.user.findUnique()` (fast PK lookup). JWT now ~400 bytes, no chunking.
- **Three-layer accumulated cookie clearing**: (1) `src/app/api/clear-cookies/route.ts` — GET endpoint not behind middleware. (2) Login page fetches it on mount. (3) `src/proxy.ts` wraps `auth()` to send clearing headers on every protected request.
- **auth.ts**: Removed custom cookies config — relies on Auth.js v5 stable defaults.
- **Categories page** — Rewritten to inventory layout (search toolbar with Export/Import/Add, table without isAvailable column, pagination).
- **Suppliers page** — Delete button already present for zero-product suppliers. No isAvailable column. Reordered toolbar buttons to Export → Import → Add.
- **Inventory toolbar** — Shortened placeholder text ("Category"/"Supplier"/"Status"), removed conflicting grid/max-width, all elements uniform h-10.
- **ImportButton component** — Created to replace CSVImportButton. Supports both .csv and .xlsx via xlsx package. Button text is "Import".
- **ExportDialog** — Trigger button changed from py-2 to h-10 for consistent height.
- **Orders page** — Added inventory-style toolbar (search + Export + Import). Added delivery method badges and delivery tracking timeline (Placed → Processing → On the Way → Completed) in expanded view.
- **Transactions page** — Restructured toolbar to inventory pattern: search left, date pills + type/status dropdowns + Export/Import right.
- **Buyers page** — Restructured toolbar to inventory pattern. Added tabs: All / Walk-In / P.O. getBuyers() server action now accepts type?: "WalkIn" | "PO".
- **POS live receipt sidebar** — Real-time receipt preview in cart sidebar showing items in receipt format (Item, Qty, Price, Total) updating live. Auto-opens receipt via downloadReceipt() after successful checkout.
- **POS layout fixes** — Category dropdown made flex-1, address/number/email fields changed from single-row to individual stacked rows.
- **Low stock email after POS** — Already implemented: checkAndAlertLowStock() called fire-and-forget after every completed transaction, uses each product's minThreshold field.
- **Audit Logs page** — Restructured toolbar to inventory pattern: search left, Panel dropdown + date range + Export/Import right. Replaced CSVImportButton with ImportButton, Loader2 with TableSkeleton.
- **Restocks page** — Added inventory-style toolbar with search, date pills, Export, Import, and New Restock button. Replaced CardSkeleton with TableSkeleton.
- **Dashboard loading.tsx** — Created with CardSkeleton (server component pattern).
- **Finance page** — Replaced inline pulse animation with CardSkeleton.
- **Loading skeleton consistency**: Dashboard/Finance use CardSkeleton (card-grid layout). All other modules (Categories, Suppliers, Orders, Buyers, Transactions, Audit Logs, Restocks) use TableSkeleton (table layout).

### Blocked
- (none)

## Key Decisions
- **imageUrl excluded from JWT** — base64 photos too large. Fetched from DB in session callback.
- **No custom cookies config** in auth.ts — rely on Auth.js v5 stable defaults to prevent versioned-cookie accumulation.
- **Suppliers delete** only allowed when `_count.products === 0` (server + UI guard).
- **Import supports CSV+XLSX** — replaced CSVImportButton with ImportButton using xlsx library.
- **Live receipt** auto-opens print dialog after checkout (StocksX behavior); manual PDF download button retained as fallback.
- **Delivery tracking** uses existing deliveryMethod + transactionStatus fields — no schema change needed. Timeline shown in expanded PO view.
- **Buyer tabs** filter by transaction type (WalkIn vs PO) — getBuyers() modified to accept optional type parameter.
- **Skeleton pattern**: CardSkeleton for dashboard-style pages (cards grid), TableSkeleton for table-based pages.

## Next Steps
- Deploy to Vercel; users should visit /login once, then log in fresh
- JWT ~400 bytes, no chunking needed
- Monitor for any future chunk accumulation

## Relevant Files
- `src/lib/auth.ts`: JWT fix — removed imageUrl from JWT; session callback fetches via Prisma
- `src/proxy.ts`: Auth middleware — clears accumulated cookies on every protected request
- `src/app/api/clear-cookies/route.ts`: API endpoint (no middleware) clearing authjs.session-token cookies
- `src/app/(auth)/login/page.tsx`: Fetches /api/clear-cookies on mount
- `src/components/import-button.tsx`: New CSV+XLSX import component replacing CSVImportButton
- `src/components/export-dialog.tsx`: Updated trigger button height to h-10
- `src/components/ui/skeleton.tsx`: CardSkeleton and TableSkeleton components
- `src/app/(dashboard)/categories/page.tsx`: Rewritten — inventory toolbar, no isAvailable column
- `src/app/(dashboard)/suppliers/page.tsx`: Reordered toolbar buttons, delete guard on `_count.products === 0`
- `src/app/(dashboard)/inventory/client.tsx`: Fixed toolbar heights, dropdown widths, placeholder text
- `src/app/(dashboard)/orders/page.tsx`: Added toolbar + delivery badges + tracking timeline
- `src/app/(dashboard)/transactions/page.tsx`: Restructured toolbar to inventory pattern
- `src/app/(dashboard)/buyers/page.tsx`: Added Walk-In/PO/All tabs, restructured toolbar
- `src/app/(dashboard)/pos/client.tsx`: Live receipt sidebar, layout fixes, auto-receipt on checkout
- `src/app/(dashboard)/audit-log/page.tsx`: Restructured toolbar, ImportButton + TableSkeleton
- `src/app/(dashboard)/restocks/page.tsx`: Added toolbar with Export/Import/TableSkeleton
- `src/app/(dashboard)/dashboard/loading.tsx`: CardSkeleton loading page
- `src/app/(dashboard)/finance/page.tsx`: Replaced inline pulse with CardSkeleton
- `src/actions/index.ts`: getBuyers(type?) — added type filter
- `src/actions/email.ts`: checkAndAlertLowStock() — checks per-product minThreshold
- `StocksX/`: Laravel + Filament PHP reference app
