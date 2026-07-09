# Naatal ERP Cloud — Code Audit Report

**Date:** 2026-07-08
**Framework:** MASTER_SYSTEM_PROMPT.md

---

## Build Status

Frontend build compiles (29/29 pages). npm audit shows 3 vulnerabilities (1 critical in Next.js 14.2.0, 1 high in xlsx, 1 moderate in postcss). Backend could not be tested locally (Python not installed).

---

## CRITICAL (10 issues)

**Security — Backend:**
1. **CORS reflection** (`main.py:32-47`) — Middleware echoes any Origin header with `Allow-Credentials: true`. Any website can steal authenticated user tokens via cross-origin requests.
2. **SQL injection** (`endpoints/licences.py:427`) — `DELETE FROM sales WHERE tenant_id = '{tenant_id}'` uses f-string interpolation in raw SQL.
3. **JWT secret default** (`core/config.py:9`) — Falls back to `"change-me-in-production"`, making tokens trivially forgeable.
4. **DB credentials in code** (`core/config.py:7`) — Default `baay:baay_secret` exposed.
5. **SQL injection surface** (`api/deps.py:57`) — Table name interpolated via f-string into raw SQL.

**Security — Frontend:**
6. **Admin phones hardcoded in JS bundle** (`licences/page.tsx:19`, `Sidebar.tsx:69`) — `SUPER_ADMIN_PHONES` array visible to anyone inspecting source.
7. **Auth tokens in localStorage** (`lib/api.ts:10-14`) — Accessible to any XSS payload.
8. **XSS in print/export** (`orders/page.tsx`, `reports/page.tsx`, `A4Invoice.tsx`) — User data injected into HTML via `document.write()` without sanitization.
9. **API keys handled from client** (`settings/page.tsx:29-32`) — WhatsApp/Wave/Orange Money keys submitted through browser.
10. **Google OAuth implicit grant** (`login/page.tsx:165`) — Deprecated flow, token exposed in URL fragment.

---

## MAJOR (49 issues)

**Backend (35):**

- Tier limits disabled — `check_limit()` calls wrapped in `except: pass` across auth, products, customers, employees endpoints. Any user can exceed their plan limits.
- Public shop orders (`endpoints/shop.py:146-245`) — No auth, no CAPTCHA, no rate limit. Anyone can place unlimited orders and decrement stock.
- Stock race condition (`services/inventory.py:18-25`) — No `SELECT FOR UPDATE`, concurrent sales can overdraw inventory.
- Free plan upgrade exploit (`endpoints/billing.py:47-86`) — When Stripe keys are absent, checkout silently activates the plan.
- Unauthenticated WebSocket (`endpoints/websocket.py:10-30`) — Any client can listen to real-time events for any tenant by guessing the ID.
- `wipe_all_data` (`endpoints/licences.py:258`) — Unscoped `DELETE FROM` on every table. One super-admin call wipes all tenants.
- Plaintext password in API responses (`endpoints/licences.py:313-349, 446-459`) — Both creation and reset return raw passwords.
- Store creation accepts raw dict (`endpoints/tenants.py:182-248`) — Can assign arbitrary user IDs globally.
- ALTER TABLE migrations all silent-fail (`main.py:95-233`) — Schema drift invisible.
- In-process rate limiting (`core/rate_limit.py:25`) — Dict-based counters don't work across multiple workers.
- No file upload size limit (`endpoints/products.py:155`) — Multi-GB uploads will OOM the server.
- N+1 queries in stock predictions and top products reports.
- Payment return URLs hardcoded to `localhost:3000`.
- `update_sale` doesn't reconcile credit tab changes.
- Google OAuth user passwords set from public `sub` claim (`endpoints/google_auth.py:82`).

**Frontend (14):**

- No Error Boundary anywhere — any render crash shows a blank white screen.
- WebSocket `pingInterval` never cleared — memory leak on reconnect.
- Duplicate session check intervals in `DashboardLayout` and `AuthProvider` — doubles network calls.
- Empty `.catch(() => {})` on most API calls — users see no feedback on failures.
- Customer/category/billing CRUD operations have no try/catch.
- `dangerouslySetInnerHTML` for service worker registration.
- BarcodeScanner stale closure — `useEffect` captures outdated `onScan`.
- Referral page race condition — two API calls overwrite same state.
- Shop minus button doesn't decrement quantity.
- Super admin check is client-side only — trivially bypassed.
- `useEffect` missing `fetchReport` dependency in reports page.

---

## MINOR (59 issues)

**Backend (30):** Missing indexes on `tenant_id` across most tables, deprecated pydantic Config class, no pool tuning on async engine, stale rate-limit keys never evicted, Sentry init failure silently swallowed, hardcoded super-admin phones duplicated in 3 files, `asyncio.create_task` without storing reference, synchronous httpx blocking event loop in FCM service, Stripe API key loaded via `os.getenv` bypassing settings validation, `get_print_settings` missing tenant ownership check.

**Frontend (29):** `any` type used extensively, `confirm()`/`prompt()` blocking UI, hardcoded domain in settings, static `<html lang="fr">` despite 3-language support, Solarized theme contrast ratio 3.4:1 (WCAG AA requires 4.5:1), viewport `userScalable: false` blocks zoom, missing `aria-label` on icon buttons, no `aria-live` regions for dynamic content, missing `rel="noopener noreferrer"` on external links, `JSON.parse` on localStorage without try/catch, missing loading states on customers/categories/POS pages, `style jsx global` print CSS conflicts between components.

---

## Gate 9 Assessment

| Requirement | Verdict |
|-------------|---------|
| Build passes | PARTIAL — frontend compiles, backend untested |
| No console errors | CANNOT VERIFY — app not running |
| No critical security issues | FAIL — 10 critical issues found |
| Every button works | FAIL — shop minus button broken |
| Every form submits | AT RISK — no error handling on most forms |
| Error boundaries | FAIL — none exist |
| Responsive tested | CANNOT VERIFY |
| Dark mode tested | CANNOT VERIFY |
| Accessibility audit | FAIL — contrast failures, missing aria labels |
| Security audit | FAIL — CORS reflection, SQL injection, XSS |

---

## Priority Fix Order

1. **CORS middleware** — Replace echo-origin with explicit allowlist
2. **SQL injection in licences** — Parameterize all raw queries
3. **JWT secret** — Require env var, fail startup if default
4. **Tier limit enforcement** — Remove the 4 `except: pass` wrappers
5. **Error Boundaries** — Add React error boundaries to layout + key pages
6. **XSS in print/export** — Sanitize all user data before HTML injection
7. **Public shop endpoint** — Add CAPTCHA + rate limiting
8. **WebSocket auth** — Validate tenant_id against authenticated user
9. **Auth token storage** — Migrate to httpOnly cookies
10. **Admin phone hardcoding** — Move to server-side only
