# Naatal ERP Cloud — Project Status

> Dernière mise à jour : 2026-06-21
> Projet : E:\movie laye sow\project\SaaS ERP for Boutique\baay-reseau
> Compte test : 📱 776621410 / 🔑 admin123 (owner, licence 60j)
> Super Admin : 📱 776621410, 708372127

---

## ✅ All Features Complete

### Backend API (FastAPI + SQLAlchemy)
- Auth : register, login, invite-employee, JWT 60min
- Products : CRUD, barcode scan, images Cloudinary, catégories
- Customers : CRUD, credit tabs, pay-credit
- Sales : CRUD, weekly stats, adjust-stock, payment links (Wave/Orange Money)
- Dashboard : summary (KPIs, graphiques)
- Reports : sales (period + date range custom), top-products, trends, period comparison
- Storefront : settings, orders status, product online toggle
- Shop (public) : store, products, orders, reviews
- Finance : suppliers, purchase-orders, expenses (7 catégories)
- WhatsApp : webhook + AI assistant (GPT-4o-mini, Wolof/Français) + campaigns
- Rate limiting : 600 req/min (5 pour login, 3 pour shop orders)
- CORS : CorsAlwaysMiddleware custom — headers sur TOUTES les réponses
- Licence : date expiration, check dans auth, 403 si expirée
- Quick Sale : vente rapide sans sélectionner de produit
- Sub-catégories : hiérarchie avec parent_id sur ProductCategory
- Description riche : champ description sur les produits
- CSV Import/Export : clients + ventes
- Auto-logout licence : désactivation/suppression invalide le tenant
- Stock predictions : IA avec niveaux d'urgence + alertes stock nul/ bas + commandes integrées
- Offline sync : endpoint POST /sales/sync pour ventes hors-ligne
- Print settings : logo, en-tête, pied de page, description société
- Multi-store : user_stores table, création/switch de boutiques
- Delivery tracking : status, livreur, livraison estimée
- Extend trial : POST /licences/extend-trial pour prolonger l'essai sans clé

### Bug Fixes (All Resolved)
- 500 auth errors, postgres:// URL, duplicate require_owner, DB éphémère
- 500 product creation (Cloudinary async), 422 tenant update, CORS security
- stock race condition (SELECT FOR UPDATE), datetime.utcnow(), OpenAI client crash
- N+1 queries, mass assignment, cross-tenant product access, password validation
- global exception handler, delete data endpoint, wizard loop, licence check
- Google OAuth (tokeninfo, phone overflow, IntegrityError, wizard)
- Quick Sale raw SQL, product category FK, CORS persistant/CORS 429
- categories dropdown, audit logs/flush, SW cache, rate limit
- empty string → null, SW cache v7
- **2026-06-21 : tenants table missing address/description columns → ALTER TABLE auto**
- **2026-06-21 : Stock predictions showing zeros → added OrderItem queries + zero-stock detection**
- **2026-06-21 : Offline products gone after reload → IndexedDB product cache**
- **2026-06-21 : A4 print missing logo → load print_settings + show logo/description**
- **2026-06-21 : License not activating → added /extend-trial endpoint**
- **2026-06-21 : Employee could modify invoices → backend PUT/DELETE requires owner**

### Security & Permissions
- Rôle-based access : employees ne peuvent PAS modifier les infos entreprise
- Owner-only endpoints : tenant update, storefront settings, reports, billing, settings
- Employee management : role assignation, toggle active/inactif
- Inactive accounts : bloqués au login
- Session check : vérification toutes les 60s + au focus de la fenêtre
- Audit logs : enregistrement des actions en DB
- **Invoice permissions : employees cannot delete/modify invoices (backend + frontend)**
- **License auto-logoff : periodic check every 60s + window focus for ALL roles**

### Licence Server
- Modèle Licence : clé unique, tier (free/pro/enterprise), durée, features
- 7 jours d'essai → auto-expire
- Activation/Upgrade : page `/activate` + Billing
- Super admin panel : `/licences`
- **Extend trial : POST /licences/extend-trial → 30 jours sans clé de licence**

### Google OAuth
- POST /auth/google → userinfo endpoint, email sur User, phone `goog:{id[:12]}`
- Bouton "Se connecter avec Google" sur /login, callback /auth/callback
- Wizard : les users Google voient le wizard au premier login

### Push Notifications FCM
- FCM v1 API via service account OAuth2
- Service Worker : push + notificationclick handlers
- Subscriptions : stockées en DB PostgreSQL

### Frontend (Next.js 14 + Tailwind)
- 28+ pages : login, register, wizard, dashboard, POS, products, customers, sales, invoices, orders, credit, expenses, reports, settings, whatsapp, storefront, shop/*, billing, licences, activate, **guide**
- 3 thèmes : Light, Dark, Solarized
- i18n : Français + Wolof + Anglais
- POS mobile : toggle Produits/Panier
- MobileNav : Rapports + Vente Rapide
- Wizard 3 étapes : infos boutique → choix plan → confirmation
- Offline sync : IndexedDB queue + auto-sync + **product cache**
- Store switcher : changement de boutique dans la sidebar
- Stock predictions : section IA sur la page produits
- **Onboarding Guide : 7-step tooltip tour, auto-shows on first login**
- **User Guide : /guide page with 16 sections, printable as PDF**

### Infrastructure
- Docker Compose
- SQLite (dev) / PostgreSQL (prod)
- Render deploy : backend + PostgreSQL
- Vercel deploy : frontend
- Keep-alive ping toutes les 10min (anti-sleep Render free tier)
- ALTER TABLE auto-add columns au démarrage (address, description, etc.)
- Neon : base de données PostgreSQL gérée via Neon
- Hot-reload : `--reload` flag + volume mount pour dev

---

## 🔧 How to Verify

### 1. Start the project
```bash
# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

### 2. Test each feature

**Service Worker (SW v7):**
- Open DevTools → Application → Service Workers → should show v7
- Update a file → SW should auto-update without Ctrl+Shift+R

**Hot-reload:**
- Change a Python file → backend should restart automatically
- Check terminal for "Reloading..." message

**Delivery Tracking:**
- Go to `/orders` → select an order → click "Suivi"
- Update tracking status → should see real-time updates via WebSocket
- Public tracking URL: `/shop/{slug}/order/{id}` → shows checkmark timeline

**Advanced Analytics:**
- Go to `/reports` → click "Tendances" tab → see 30-day line chart
- Click "Comparer" tab → select two periods → compare

**WhatsApp Campaigns:**
- Go to `/whatsapp` → click "Campagnes" tab
- Select recipients → write message → send
- WhatsApp Bot config: Settings → WhatsApp Bot card

**AI Stock Predictions:**
- Go to `/products` → click "Prédictions" button
- Shows urgency levels (critical/high/medium) with reorder suggestions
- Includes both Sales + Orders data

**Multi-Store:**
- Go to Settings → "Mes Boutiques" card
- Create new store, switch between stores
- Store switcher in sidebar when multiple stores

**Offline Sync:**
- Turn off network → make a sale in POS → sale queued in IndexedDB
- Products cached in IndexedDB → survive page reload
- Turn on network → next sale auto-syncs pending sales

**Custom Print:**
- Go to `/settings` → "Impression" card
- Add logo URL, header/footer text → test receipt printing
- A4 invoice shows logo + company description

**Invoice Permissions:**
- Login as employee → `/sales` → click a sale
- Employee sees only "Imprimer" and "PDF" buttons (no delete/edit)
- Owner sees all buttons including "Annuler la facture"

**License Management:**
- Trial lasts 7 days from registration
- When expired: page `/activate` shows
- Click "Prolonger l'essai de 30 jours" → extends without licence key
- Or enter licence key to activate pro/enterprise plan

**Onboarding Guide:**
- First login → 7-step tooltip tour appears
- Walks through: Dashboard, POS, Products, Orders, Reports, Settings
- Click "Terminé" to dismiss, never shows again

**User Guide:**
- Go to `/guide` → comprehensive 16-section documentation
- Click "Imprimer / PDF" to save as PDF

### 3. API Endpoints to test
```
GET  /api/v1/reports/trends?days=30
GET  /api/v1/reports/compare?period1_start=...&period1_end=...&period2_start=...&period2_end=...
GET  /api/v1/reports/stock-predictions
POST /api/v1/whatsapp/campaigns
POST /api/v1/sales/sync
GET  /api/v1/tenants/stores
POST /api/v1/tenants/stores
PUT  /api/v1/tenants/stores/{id}/switch
GET  /api/v1/tenants/{id}/print-settings
PUT  /api/v1/tenants/{id}/print-settings
PUT  /api/v1/storefront/orders/{id}/tracking
GET  /api/v1/storefront/orders/{id}/tracking
POST /api/v1/licences/extend-trial
```

---

## 📝 Notes
- 8GB RAM machine — utiliser `NODE_OPTIONS=--max-old-space-size=4096` pour les builds Vercel
- Le premier login nécessite internet (puis offline sur LAN)
- Toutes les tables sont UUID + tenant_id pour l'isolation multi-tenant
- Base de données sur Neon (pas Render PostgreSQL)
- firebase-service-account.json dans .gitignore — doit être ajouté manuellement sur Render
- SQLite dev DB: `backend/naatal_erp.db` — persists across restarts
- Tenant model now has `address` and `description` columns (auto-added on startup)

## 📞 Support
- 📱 +221 77 662 14 10
- 💬 WhatsApp : +221 70 837 21 27
- 📧 layedevops@gmail.com
