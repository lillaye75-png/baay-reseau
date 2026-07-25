# QA Report — 3 Known Issues Fix (2026-07-25)

STATUS: ALL PASSED

## Bug 1: Store Assignment Persistence

### Test Flow
1. Created owner account via `/auth/register` → user_stores row created ✓
2. Invited employee via `/auth/invite-employee` → user_stores row created ✓
3. Employee login → sees 1 store (`/tenants/stores`) ✓
4. Owner creates new store with `assigned_user_id` → employee assigned ✓
5. Employee now sees 2 stores ✓
6. Employee switches store via `/tenants/stores/{id}/switch` → `User.tenant_id` updated ✓
7. After switch, `/tenants/me` returns the new store ✓

### Changes Made
| File | Change |
|------|--------|
| `backend/app/api/v1/endpoints/auth.py:44-49` | Removed silent `try/except` on user_stores INSERT in register |
| `backend/app/api/v1/endpoints/auth.py:117-122` | Added user_stores INSERT in invite-employee |
| `backend/app/api/v1/endpoints/tenants.py:213-231` | Removed silent `try/except` on both owner + employee user_stores INSERTs |
| `backend/app/api/v1/endpoints/tenants.py:263-266` | Added `UPDATE users SET tenant_id` in switch_store |
| `backend/app/api/v1/endpoints/tenants.py:167-173` | Removed silent `try/except` on list_my_stores |

---

## Bug 2: Onboarding Guide Appears Every Login

### Test Flow
1. New tenant registration → `guide_completed` defaults to `false` ✓
2. PUT `/tenants/{id}` with `{ guide_completed: true }` → persisted to DB ✓
3. GET `/tenants/me` returns `guide_completed: true` ✓
4. Login reads `guide_completed` from API and syncs localStorage ✓

### Changes Made
| File | Change |
|------|--------|
| `backend/app/models/tenant.py:33` | Added `guide_completed` boolean column |
| `backend/app/schemas/tenant.py:18,43` | Added to TenantUpdate and TenantRead |
| `backend/app/main.py:136-138` | Added ALTER TABLE for guide_completed |
| `frontend/src/components/layout/OnboardingGuide.tsx:5,96-99` | Import api, call PUT on completion |
| `frontend/src/lib/auth-context.tsx:105-107` | Sync localStorage from API guide_completed |
| `frontend/src/app/auth/callback/page.tsx:44-46` | Same sync for Google OAuth |

---

## Bug 3: WebSocket/Polling

### Test Flow
1. Created order via `/shop/store/{slug}/order` → `notify_new_order` called ✓
2. Event persisted in `event_queue` DB table (verified via SQLite) ✓
3. `GET /api/v1/events/{tenant_id}` returns the event ✓

### Changes Made
| File | Change |
|------|--------|
| `backend/app/main.py:248-261` | Added `event_queue` DB table creation |
| `backend/app/api/v1/endpoints/websocket.py` | Replaced in-memory event_queues with DB-backed store. Added `db` param to broadcast functions |
| `backend/app/api/v1/endpoints/events.py` | Rewrote to use DB instead of importing removed event_queues |
| `backend/app/api/v1/endpoints/shop.py:221-232` | Added `notify_new_order(db=db)` call |
| `frontend/src/app/orders/page.tsx:117` | Poll interval 10000 → 30000ms |
