# QA Report — Google OAuth Fix
**Feature:** Google OAuth login configuration
**Date:** 2026-07-24
**Tester:** Automated SENSE-QA + UAT-SIM

**STATUS: PASSED** — 0 bugs found

---

## SENSE-QA Results

### Eyes (visual)
| Breakpoint | Element | Status |
|-----------|---------|--------|
| Mobile 390px | "Se connecter avec Google" button | PASS — visible, centered, correct styling |
| Tablet 768px | "Se connecter avec Google" button | PASS — properly positioned below separator |
| Desktop 1440px | "Se connecter avec Google" button | PASS — right column, full width button with Google logo |

### Hands (interactive)
| Test | Result |
|------|--------|
| Click "Se connecter avec Google" | PASS — redirects to accounts.google.com |
| Redirect contains correct Client ID | PASS — `251752897480-99frcitp4cdi696v3omo10pjpr0ihc5r` |
| Redirect contains correct redirect URI | PASS — `baay-reseau.vercel.app/auth/callback` |
| CSRF state parameter present | PASS — UUID-based state included |
| Scope includes email+profile | PASS |
| Response type is authorization code | PASS — `response_type=code` |
| Prompt is select_account | PASS — user can switch accounts |

### Ears (console/network)
| Check | Result |
|-------|--------|
| Login page load | 0 errors |
| Google button click | 0 errors |
| Callback page (no code) | 0 errors |
| Callback page (user cancelled) | 0 errors |
| Callback page (bad state) | 0 errors |
| Backend /auth/google (fake code) | 0 errors |

### Legs (user journey)
| Flow | Status |
|------|--------|
| Login page → Click Google → Redirect to Google | PASS |
| Google user cancels → `?error=access_denied` → Shows "Connexion Google annulée" | PASS |
| Callback without code → Shows "Pas de code d'autorisation reçu" | PASS |
| Callback with invalid state → Shows CSRF warning | PASS |
| Callback with valid state + bad code → Redirects to /login gracefully | PASS |

---

## UAT-SIM Results
| Test | Result |
|------|--------|
| Backend POST /auth/google with no code | 400 — "Code d'autorisation Google requis" |
| Backend POST /auth/google with empty body | 400 |
| Backend POST /auth/google with missing redirect_uri | 401 — Google rejects |
| Backend POST /auth/google with fake code | 401 — "Code Google invalide ou expiré" |
| Frontend callback without oauth_state in localStorage | CSRF warning shown |
| OAuth state mismatch | CSRF warning shown |
| Login page with Google button + phone login both visible | PASS — both auth methods present |

---

## Configuration Verified
| Setting | Value | Where |
|---------|-------|-------|
| GOOGLE_CLIENT_ID | `251752897480-99frcitp4cdi696v3omo10pjpr0ihc5r.apps.googleusercontent.com` | Backend + Frontend Vercel |
| GOOGLE_CLIENT_SECRET | `GOCSPX-8ke...` | Backend Vercel |
| Redirect URI | `https://baay-reseau.vercel.app/auth/callback` | Google Cloud Console |
