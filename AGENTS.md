## Goal
- Port Java desktop POS/inventory system (HardwareHub → AnvilOS) to Next.js web app on Vercel + NeonDB; resolve all remaining issues before SaaS transition

## Constraints & Preferences
- Next.js 16.2.6 (App Router) + Prisma 7.8.0 + PostgreSQL (NeonDB) + Tailwind CSS 4 + TypeScript + shadcn/ui (radix-sera preset)
- Auth.js v5 (credentials provider, JWT strategy); `@prisma/adapter-pg` for Prisma v7 client engine
- Custom industrial theme: #0e212c blue, #fd761a orange, 4px radius, `bg-surface-container` removed (not a valid class)
- `anvilos-desktop/` kept in-repo as reference
- File header comment block required on every source file

## Progress
### Done
- **Editable qty input in POS cart**: Replaced read-only `<span>` with a click-to-edit `<input>` between +/- buttons (press Enter/blur to commit, Escape to cancel). State: `editingQty`, `qtyInput`, with `startQtyEdit`/`commitQtyEdit` functions.
- **Mobile thumb-zone cart button**: Replaced the small "View Cart" header button with a fixed bottom bar containing cart count + total, positioned in the thumb zone with gradient backdrop. When cart is empty shows an empty-state hint.
- **Larger touch targets**: +/- buttons increased to 36×36px (w-9 h-9), remove button to 36×36px, both with `aria-label` for accessibility. All buttons have `active:` feedback.
- **Page-level padding**: Added `pb-24 lg:pb-0` to page root so the fixed bottom bar never overlaps content.
- **processRestock bug**: Added `prisma.transaction.update` to set status `"Completed"` after processing — fixes infinite loop (Process button stayed active forever)
- **Restocks page redesign**: POS-style cart modal (search products + cart with qty controls), no supplier name field, restock created as `"Ongoing"` so Process button appears
- **Product photo upload**: File upload (`accept="image/*"`) replaces URL input in Add/Edit product modals; uses FileReader → base64 data URL
- **Category dropdown dedup**: `renderCategoryOptions` filters to `parentCategoryId === null` at root, recurses into `childCategories`; parent categories `disabled` with "(parent)" label
- **POS receipt fixes**: buyerName and grandTotal stored in `done` state at checkout (was being cleared before download)
- **Homepage fixes**: StatsBar `bg-muted` (no `bg-surface-container`); footer logo `opacity-80 dark:brightness-0 dark:invert`; navbar floating (`top-4 left-4 right-4 w-[calc(100%-2rem)]` when scrolled); FeaturesGrid no misleading `cursor-pointer`; Hero video wrapped with fallback
- **New public subpages**: `/solutions`, `/company`, `/marketplace`, `/pricing`, `/contact` — moved out of auth-gated `(dashboard)` route group to root `app/`; old `(dashboard)` versions deleted; `[...slug]` catch-all enhanced
- **Chart.js dashboard**: Installed `chart.js` + `react-chartjs-2`; `src/components/charts.tsx` with RevenueChart (bar), TxnTypeChart (doughnut), StockChart (doughnut); `getDashboardCharts` server action; replaced CSS bar chart
- **Fixed duplicate `X` import** in POS client (caught by build type-check)

### Blocked
- (none)

## Key Decisions
- Product photos stored as base64 data URLs in PostgreSQL `TEXT` field (no external storage)
- Chart.js chosen over Recharts or custom SVG for dashboard charts
- Floating navbar from ui-ux-pro-max skill (`top-4 left-4 right-4` rounded-xl when scrolled)
- Mobile bottom bar replaced the header-based "View Cart" button for better thumb-zone UX
- Editable qty uses inline `<input>` that swaps in on click (no modal/popover)

## Next Steps
- Deploy to Vercel (vercel.json exists, build passes with 27 routes)

## Relevant Files
- `src/actions/index.ts`: `processRestock` updates `transactionStatus: "Completed"` (line ~571); `getDashboardCharts` (lines ~761-779)
- `src/app/(dashboard)/pos/client.tsx`: Editable qty `<input>`, mobile bottom cart bar, larger touch targets, receipt data in `done` state
- `src/app/(dashboard)/restocks/page.tsx`: POS-style cart modal, editable qty, no supplier name
- `src/components/charts.tsx`: RevenueChart (Bar), TxnTypeChart (Doughnut), StockChart (Doughnut)
- `src/components/Navbar.tsx`: Floating navbar when scrolled
- `src/components/Hero.tsx`: `"use client"`, video with fallback overlay
- `src/components/sections/StatsBar.tsx`, `Footer.tsx`: Fixed broken classes/styling
- `src/app/solutions/page.tsx`, `src/app/company/page.tsx`, `src/app/marketplace/page.tsx`, `src/app/pricing/page.tsx`, `src/app/contact/page.tsx`: New public pages
- `src/app/[...slug]/page.tsx`: Enhanced catch-all
- `src/app/(dashboard)/inventory/client.tsx`: File upload product photos, parent-category disabled dropdown
- `src/app/(dashboard)/dashboard/page.tsx`: Chart.js dashboard
