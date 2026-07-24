# QA Report — Login Bug Fix + Vercel Migration
**Feature:** Backend migration from Render to Vercel
**Date:** 2026-07-24
**Tester:** Automated SENSE-QA + UAT-SIM

**STATUS: PASSED** (2 bugs found and fixed in FIX LOOP)

---

## SENSE-QA Results

### Eyes (visual)
| Breakpoint | Page | Status |
|-----------|------|--------|
| Mobile 390px | Homepage | PASS — all elements visible, no cut-off text |
| Tablet 768px | Homepage | PASS — responsive layout correct |
| Desktop 1440px | Homepage | PASS — full layout rendered |
| Desktop 1440px | Dashboard | PASS — KPIs, charts, navigation all visible |
| Desktop 1440px | Login | PASS — form centered, Google button visible |

### Hands (interactive)
| Test | Result |
|------|--------|
| Empty form submit | PASS — stays on login page |
| Wrong credentials | PASS — shows "Invalid credentials" |
| Valid credentials | PASS — redirects to dashboard |
| Navigate Products | PASS — no errors |
| Navigate Sales | PASS — no errors |
| Navigate Orders | PASS — no errors |
| Navigate POS | PASS — loads correctly |
| Logout | PASS — redirects to /login |

### Ears (console/network)
| Check | Result |
|-------|--------|
| Homepage console errors | 0 |
| Login console errors (valid) | 0 |
| Dashboard console errors | 0 |
| Products console errors | 0 |
| Sales console errors | 0 |
| Orders console errors | 0 |

### Legs (user journey)
| Flow | Status |
|------|--------|
| Landing → Login → Dashboard | PASS |
| Dashboard → Products → Listing | PASS |
| Dashboard → Sales → Empty state | PASS |
| Dashboard → Orders → Empty state | PASS |
| Protected routes without auth → redirect to /login | PASS |
| Backend health check | PASS — `{"status":"ok"}` |

---

## UAT-SIM Results
| Test | Result |
|------|--------|
| XSS injection in phone field | PASS — no script execution |
| SQL injection in login | PASS — rejected correctly |
| Access /dashboard without auth | PASS — redirected to /login |
| Access /audit without auth | PASS — redirected to /login |
| API access without auth | PASS — returns 403 |

---

## Bugs Found & Fixed
| # | Bug | Fix |
|---|-----|-----|
| 1 | `500` on `/api/v1/dashboard/summary` — tables not created on Vercel cold start (lifespan=off) | Extracted init_db(), call it in api/index.py on Vercel |
| 2 | `404` on `/api/v1/events/{id}` — endpoint at wrong route path | Created separate events.py at correct `/api/v1/events/` path |

---

## Residual Notes
- WebSocket: unavailable on Vercel (expected), polling fallback active
- Background scheduler: converted to cron endpoints, Vercel Cron Job at 8 AM
- Uploads: Cloudinary handle already, local /uploads mount disabled on Vercel
