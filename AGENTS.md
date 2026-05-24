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
- **Error 494 fix — accumulated cookie chunks**: Auth.js v5 `SessionStore` chunks JWT tokens >4096 bytes as `__Secure-authjs.session-token.0`, `.1`, etc. Each page load created a new chunk set, and old chunks should be deleted via `Set-Cookie: Max-Age=0`. But when cookie options changed between deploys (custom `cookies` config added then removed), browsers silently kept old chunks. 50+ chunks × ~4KB = 200KB cookie header → Vercel proxy 494. **Fix**: Three layers — (1) `src/app/api/clear-cookies/route.ts`: API endpoint (not behind middleware) reads incoming cookies and sends `Set-Cookie: Max-Age=0` for every `authjs.session-token` cookie. (2) Login page fetches this endpoint via `useEffect` on mount to clear HttpOnly cookies that `document.cookie` cannot read. (3) `src/proxy.ts`: Auth middleware wrapper sends clearing `Set-Cookie` headers on every protected-route request (backup for ongoing prevention). Auth.js v5 always appends its own session-refresh cookie AFTER our clearing headers (`next-auth/lib/index.js:168`), so current sessions aren't disrupted.
- **auth.ts**: Removed custom `cookies` config — Auth.js v5 uses its own stable defaults (`__Secure-authjs.session-token`, sameSite: "lax", path: "/", secure: true). This prevents the cookie-option churn that caused chunk accumulation.
- **224KB JWT root cause — imageUrl removed from JWT**: The user's profile photo (stored as base64 data URL in `imageUrl`) was included directly in the JWT token via `token.imageUrl = user.imageUrl`. A 200KB+ base64 image made the JWT 229KB, forcing Auth.js to create 58 cookie chunks per session. **Fix**: Removed `imageUrl` from JWT callback entirely. Session callback now fetches `imageUrl` via `prisma.user.findUnique()` — a fast primary-key lookup instead of bloating the JWT. JWT is now ~400 bytes, no chunking needed.
- **All earlier progress preserved**: Editable qty, mobile cart bar, processRestock bug, restocks redesign, photo uploads, category dropdown, POS receipts, homepage fixes, public subpages, Chart.js dashboard, etc.

### Blocked
- (none)

## Key Decisions
- Product photos stored as base64 data URLs (no external storage)
- Chart.js for dashboard charts
- 494 fix uses three layers: middleware (server-side), API endpoint (behind `/login`), and login-page fetch (client-side)
- No custom `cookies` config in auth.ts — rely on Auth.js v5 stable defaults
- `src/proxy.ts` wraps `auth()` instead of re-exporting directly, allowing custom middleware logic
- Auth.js v5's cookie chunking (`SessionStore`) is documented behavior, not a bug — the accumulation was caused by changing cookie options between deploys
- **imageUrl excluded from JWT** — profile photos stored as base64 are too large for JWT. Fetched from DB via session callback instead.

## Next Steps
- Deploy to Vercel; users should visit `/login` once, then log in fresh
- The JWT is now small (~400 bytes), so Auth.js v5 will create 0-1 cookies instead of 58
- Monitor for any future chunk accumulation (should be fully resolved)

## Relevant Files
- `src/proxy.ts`: Auth middleware wrapper — sends `Set-Cookie: Max-Age=0` for accumulated cookies on every request
- `src/app/api/clear-cookies/route.ts`: API endpoint (no middleware) that reads request cookies and returns clearing headers
- `src/app/(auth)/login/page.tsx`: Fetches `/api/clear-cookies` on mount to clear HttpOnly cookies before login
- **`src/lib/auth.ts`**: **Critical fix** — removed `imageUrl` from JWT callback (prevents 224KB JWT). Session callback fetches `imageUrl` via `prisma.user.findUnique()` instead.
- `src/app/(dashboard)/layout.tsx`: Dashboard auth gate (unchanged)
- `node_modules/@auth/core/lib/utils/cookie.js`: `SessionStore` class showing chunking logic (`ALLOWED_COOKIE_SIZE=4096`, chunk naming `base.N`)
- `node_modules/next-auth/lib/index.js:127-169`: `handleAuth` showing middleware flow — session cookies always appended after user callback response
