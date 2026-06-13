# AnvilOS Session Summary — June 13, 2026 (Evening)

## What Happened

### Connection Pool Chaos
- Added pool params to DATABASE_URL: `?connectionLimit=3&idleTimeout=120&acquireTimeout=10`
- **CRASH**: MariaDB driver uses MILLISECONDS, not seconds. `acquireTimeout=10` = 10ms, `idleTimeout=120` = 120ms. Connections failed instantly → crash-loop
- Removed pool params → still crash-looping (Hostinger cache clean wiped `.next`, needed rebuild)
- Deployed clean build → app crash-looped with "Ready in 0ms" repeatedly

### Debug Processlist Page
- Created `/debug/processlist` to monitor MySQL connections in real-time
- First attempt: API route at `/api/debug/processlist` → **403 from Hostinger WAF** (all `/api/*` routes blocked)
- Second attempt: Server component with client wrapper, no API route → **WORKS**
- Auto-refresh was too aggressive (3s default, 1s option) creating 14+ connections
- **Fixed**: Auto-refresh OFF by default, minimum interval 5s, max 30s

### 503 Root Cause
- The crash-loop was creating orphaned MySQL connections that never got released
- Each restart creates a new Prisma connection pool (default 10 connections)
- After multiple restarts, connections accumulate toward `max_connections_per_hour: 500`
- The processlist page with 3s auto-refresh was ADDING to this problem (2 connections per refresh)
- Server component approach: each `router.refresh()` re-renders server-side, running `SHOW PROCESSLIST` + auth session callback

### React Error #418
- Minified React error #418 = text content mismatch during hydration
- Likely caused by the processlist page rendering differently on server vs client (timestamps, connection count)

## Key Technical Findings

1. **Hostinger ignores `start` script in package.json** — Framework preset "Next.js" means it always uses `next start`
2. **Hostinger blocks `/api/*` routes** — Their nginx proxy returns 403 HTML for all API routes (including Auth.js session endpoint). This is a hosting infrastructure issue.
3. **Hostinger Runtime Logs = stdout only** — Errors to stderr are lost. No separate error log panel.
4. **MariaDB driver URL params are in milliseconds** — NOT seconds. `idleTimeout=120` means 120ms, not 120s.
5. **`SHOW PROCESSLIST` thread IDs ≠ connection IDs** — They're MySQL internal IDs that change between queries. Can't use them for KILL.
6. **Orphaned connections accumulate** — When Node.js crashes, the MariaDB pool doesn't close cleanly. Connections stay in Sleep state until MariaDB's `wait_timeout` (default 28800s = 8 hours).

## Current State

### Working
- App is live and functional at https://cwlhardware.kloudexa.com
- Debug processlist page at `/debug/processlist` (SUPERADMIN only, server component, no API route)
- Auto-refresh disabled by default to prevent connection churn
- 7 connections visible (healthy)

### Files Changed Today
- `src/app/(dashboard)/debug/processlist/page.tsx` — Server component, queries DB directly
- `src/app/(dashboard)/debug/processlist/client.tsx` — Client wrapper with manual refresh
- `src/app/api/debug/` — DELETED (blocked by Hostinger WAF)
- `server.js` — DELETED (was interfering with Hostinger's `next start`)
- `package.json` start script — back to `"next start"`
- `.env` — DATABASE_URL clean (no pool params)

### Pending
- Handover prompt prepared for Antigravity to investigate crash-loop root cause
- React hydration error #418 on processlist page (low priority)
- Preload warnings from Next.js font loading (benign)

## Constraints
- Hostinger shared hosting: `max_connections_per_hour: 500`
- Node 24.x, no custom start command possible
- No error logs (only stdout Runtime Logs)
- No WAF/firewall configuration available
- All `/api/*` routes blocked by Hostinger proxy
