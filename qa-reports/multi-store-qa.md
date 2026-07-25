# QA Report — Multi-Store Flow

**STATUS: ALL FIXES DEPLOYED & VERIFIED — 4 bugs fixed, all multi-store operations working**

**Date:** 2026-07-25
**Tester:** Automated (Playwright + API)
**Account:** 776621410 / admin123 (owner, super admin)
**Employee:** 771234567 / admin123 (baye sow)
**Test Employee:** Awa Gueye / 775555555 / test123
**Deployment:** https://baay-reseau.vercel.app (frontend) + https://baay-reseau-api.vercel.app (backend)
**Commit:** f3f92f0 — deployed via Vercel CLI at 18:55 GMT

---

## Test Flow

| Step | Action | Result | Screenshot |
|------|--------|--------|------------|
| 1 | Login as owner (776621410) | OK — Dashboard shows | multi-store-test-03-admin-dashboard.png |
| 2 | Navigate to Settings | OK — "Mes Boutiques" visible, "Équipe" with 1 employee | multi-store-test-04-settings-store-manager.png |
| 3 | Add employee "Amadou Sow" (771111111) | OK — showed 2 employees in UI | - |
| 4 | Create sub-shop "Boutique Test" + assign Amadou | 200 returned but store didn't appear in list | multi-store-test-04-settings-store-manager.png |
| 5 | Page reload — employees disappeared | 0 employé(s) — data wasn't committed | - |
| 6 | Create sub-shop "Boutique API" (no employee) | OK — store created, switchable | - |
| 7 | POS sale on current store | OK — 201, receipt generated | multi-store-test-05-sale-receipt.png |
| 8 | Reports page | OK — 3 sales, 375,000 CFA | multi-store-test-06-reports.png |
| 9 | UAT: Login as employee (771234567) | OK — Settings shows no "Équipe" or "Mes Boutiques" | - |
| 10 | UAT: Employee access /reports | 403 blocked (correct) | - |
| 11 | UAT: Employee switch store | 403 blocked (correct) | - |
| 12 | API: /reports/by-store | OK — returns per-store data | - |
| 13 | API: /reports/sales?store_id=... | OK — filters by store | - |
| 14 | **POST-DEPLOY**: Create employee Awa Gueye (775555555) | OK — created, visible immediately | - |
| 15 | **POST-DEPLOY**: Create store "Boutique Awa" + assign Awa | OK — store in list immediately | - |
| 16 | **POST-DEPLOY**: Switch to Boutique Awa | OK — 200, switched to new tenant | - |
| 17 | **POST-DEPLOY**: 3 stores in list (Test Deploy, Boutique Awa, Boutique API) | OK | - |
| 18 | **POST-DEPLOY**: By-store report shows all 3 stores separate | OK — 0 sales each (no sales on new stores) | - |
| 19 | **POST-DEPLOY**: Tenant isolation (Boutique Awa has 0 products) | OK — correct cross-tenant isolation | - |

---

## Bugs Found (All Fixed & Deployed)

| # | File | Bug | Fix | Status |
|---|------|-----|-----|--------|
| 1 | `tenants.py:226` | `0` instead of `FALSE` for BOOLEAN → silent rollback after 200 | `0` → `FALSE` | Deployed & verified |
| 2 | `tenants.py:234` | `POST /stores` — no explicit commit | Added `await db.commit()` | Deployed & verified |
| 3 | `tenants.py:269` | `PUT /stores/{id}/switch` — no explicit commit | Added `await db.commit()` | Deployed & verified |
| 4 | `auth.py:123` | `POST /invite-employee` — no explicit commit | Added `await db.commit()` | Deployed & verified |

---

## What Works Correctly

- **Login**: owner and employee login works
- **Store creation** (without employee assignment): works, stores are switchable
- **POS sales**: correct tenant_id recorded, receipt generated
- **Reports**: sales, top-products, trends, by-store all return correct data
- **Store filtering**: `store_id` parameter works on all report endpoints
- **Admin hardening**: employees blocked from reports (403), store switching (403), store management (hidden UI)
- **No console errors** during normal owner operations

---

## Verified After Deploy

1. Store creation WITH employee assignment — ✓ working
2. Employee creation with immediate visibility — ✓ working
3. Store switching (instant commit, no race condition) — ✓ working
4. Multi-store: 3 stores in list — ✓ working
5. By-store report separation — ✓ working
6. Tenant isolation (empty products on new store) — ✓ working
