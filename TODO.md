# Naatal ERP Cloud — TODO Complet

> Dernière mise à jour : 2026-06-16
> Projet : E:\movie laye sow\project\SaaS ERP for Boutique\baay-reseau
> Compte test : 📱 776621410 / 🔑 admin123 (owner, licence 60j)
> Super Admin : 📱 776621410, 708372127

---

## ✅ CE QUI EST FAIT

### 1. Backend API (FastAPI + SQLAlchemy)
- [x] Auth : register, login, invite-employee, JWT 60min
- [x] Products : CRUD, barcode scan, images Cloudinary, catégories
- [x] Customers : CRUD, credit tabs, pay-credit
- [x] Sales : CRUD, weekly stats, adjust-stock, payment links (Wave/Orange Money)
- [x] Dashboard : summary (KPIs, graphiques)
- [x] Reports : sales (period + date range custom), top-products
- [x] Storefront : settings, orders status, product online toggle
- [x] Shop (public) : store, products, orders, reviews
- [x] Finance : suppliers, purchase-orders, expenses (7 catégories)
- [x] WhatsApp : webhook + AI assistant (GPT-4o-mini, Wolof/Français)
- [x] Rate limiting : 300 req/min (5 pour login, 3 pour shop orders)
- [x] CORS : allow all origins (fixé avec allow_origin_regex)
- [x] Licence : date expiration, check dans auth, 403 si expirée
- [x] **Quick Sale** : vente rapide sans sélectionner de produit (POST /sales/quick)
- [x] **Sub-catégories** : hiérarchie avec parent_id sur ProductCategory
- [x] **Description riche** : champ description sur les produits
- [x] **CSV Import** : import clients depuis CSV (POST /customers/import-csv)
- [x] **CSV Export** : export clients + ventes en CSV
- [x] **Auto-logout licence** : quand admin désactive/supprime licence, le tenant est invalidé

### 12. Bug Fixes (2026-06-15 → 2026-06-16)
- [x] **Fix 500 auth errors** : `LoyaltyPoint.customer` avait `back_populates` cassé
- [x] **Fix postgres:// URL** : Render fournit `postgres://` — ajout support + gestion `sslmode`
- [x] **Fix duplicate require_owner** : fonction définie 2× dans `deps.py`
- [x] **Fix DB éphémère** : SQLite → PostgreSQL Render via `fromDatabase`
- [x] **Fix 500 product creation** : Cloudinary sync calls bloquaient l'event loop async → `run_in_executor`
- [x] **Fix 422 tenant update** : `TenantRead` utilisé comme schéma input → créé `TenantUpdate` avec champs optionnels
- [x] **Fix CORS security** : `allow_origin_regex=".*"` au lieu de wildcard incompatible avec credentials
- [x] **Fix stock race condition** : `SELECT FOR UPDATE` pour éviter overselling sur shop orders
- [x] **Fix datetime.utcnow()** : remplacé par `datetime.now(timezone.utc)` dans scheduled_tasks
- [x] **Fix OpenAI client crash** : lazy init au lieu de module-level instantiation
- [x] **Fix N+1 queries** : storefront products utilise `selectinload` au lieu de queries séparées
- [x] **Fix mass assignment** : ajout de `ALLOWED_FIELDS` sur tous les endpoints `setattr`
- [x] **Fix cross-tenant product access** : ajout filtre `tenant_id` dans `create_sale`
- [x] **Fix password validation** : min 6 caractères sur `UserCreate`
- [x] **Fix global exception handler** : catchait `HTTPException` → supprimé (causait 500 sur tous les endpoints)
- [x] **Fix delete data endpoint** : rewrite avec raw SQL paramétrés (FK constraints)
- [x] **Fix wizard loop** : ajout champ `wizard_completed` sur Tenant + vérification côté serveur
- [x] **Fix licence check** : ne bloque plus si licence expirée mais pas de licence active assignée
- [x] **Fix licence deactivation** : toggle/delete licence invalide le tenant (license_expires_at = now)
- [x] **Fix deactivate tenant login** : vérification tenant.is_active au login
- [x] **Fix SaleItem FK** : product_id nullable pour les ventes rapides (quick-sale)
- [x] **Fix 403 on tenant/me** : interceptor gère licence_expired + account_disabled proprement

### 13. Sécurité & Permissions (2026-06-16)
- [x] **Rôle-based access** : employees ne peuvent PAS modifier les infos entreprise
- [x] **Owner-only endpoints** : tenant update, storefront settings, reports, billing, settings
- [x] **Employee management** : role assignation (employee/manager), toggle active/inactif
- [x] **Employee delete restriction** : tous les DELETE endpoints requièrent owner
- [x] **Inactive accounts** : bloqués au login
- [x] **Session check** : vérification toutes les 60s + au focus de la fenêtre

### 14. Licence Server (2026-06-16)
- [x] **Modèle Licence** : clé unique, tier (free/pro/enterprise), durée, features
- [x] **7 jours d'essai** : enregistrement → 7 jours gratuits → auto-expire
- [x] **Activation de licence** : page `/activate` avec clé
- [x] **Upgrade de plan** : depuis la page Billing, entrer clé pour changer de tier
- [x] **Super admin panel** : `/licences` — générer, activer/désactiver, supprimer licences
- [x] **Licence key format** : `BAY-F-...` (Free), `BAY-P-...` (Pro), `BAY-E-...` (Enterprise)
- [x] **Sidebar super admin** : icône Licences en jaune (visible uniquement pour 776621410, 708372127)

### 15. Settings & Données (2026-06-16)
- [x] **WhatsApp Bot API** : configuration token + Phone Number ID dans settings
- [x] **Payment API** : configuration Wave + Orange Money keys dans settings
- [x] **Backup download** : export JSON (products, customers, sales, suppliers, expenses)
- [x] **Restore backup** : import JSON pour restaurer données
- [x] **Delete all data** : suppression complète avec double confirmation (owner only)
- [x] **Contact support** : +221776621410, +221708372127, layedevops@gmail.com dans Settings + Billing
- [x] **Custom shop URL** : owner définit slug dans settings → /shop/slug

### 16. Frontend (Next.js 14 + Tailwind)
- [x] **Sidebar nettoyée** : Catégories cachées, Factures→Ventes fusionnées, WhatsApp/Parrainage supprimés
- [x] **Boutique en ligne** : déplacée dans Settings (pas dans sidebar)
- [x] **POS mobile** : toggle Produits/Panier sur mobile
- [x] **MobileNav** : Rapports ajouté à la barre du bas
- [x] **Mobile sidebar** : fermeture au clic extérieur (stopPropagation)
- [x] **Login auto-refresh** : ne redirige plus sur /login quand on est déjà sur /login
- [x] **Shop product images** : utilisation `getImageUrl()` au lieu de `${API}` pour Cloudinary URLs
- [x] **Wizard 3 étapes** : infos boutique → choix plan → confirmation (premier login)
- [x] **Licence upgrade** : clé de licence dans la page Billing
- [x] **Licence management** : page `/licences` pour super admin
- [x] **Activation page** : `/activate` quand licence expirée
- [x] **Quick Sale page** : `/quick-sale` pour ventes rapides sans produit
- [x] **CSV Import clients** : bouton d'import sur la page clients
- [x] **CSV Export ventes** : bouton d'export CSV sur la page ventes
- [x] **Wizard completion** : utilise `wizard_completed` au lieu de vérifier le nom
- [x] **Session check** : gère 403 licence_expired + account_disabled
- [x] **AuthGuard** : `/activate` ajouté aux routes publiques
- [x] **i18n** : traduction `quick_sale` FR/WO
- [x] **MobileNav** : Vente Rapide ajoutée

### 2. Frontend pages
- [x] 26 pages : login, register, wizard, dashboard, POS, products, customers, sales, invoices, orders, credit, expenses, reports, settings, whatsapp, storefront, shop/*, billing, licences, activate
- [x] 3 thèmes : Light, Dark, Solarized
- [x] i18n : Français + Wolof

### 3. POS
- [x] Panier avec qty +/-, recherche, scan code-barres
- [x] Scanner caméra (html5-qrcode)
- [x] Impression Bluetooth (BLE) + ESC/POS thermique
- [x] Paiement : Cash, Wave, Orange Money, Crédit
- [x] Lien de paiement Wave/Orange Money (QR code)
- [x] Mobile : toggle Produits/Panier

### 8. Rapports
- [x] Date range picker personnalisé (du/au)
- [x] KPIs : ventes, revenu, dépenses, bénéfice net
- [x] Graphique répartition paiements + top produits
- [x] Export CSV + PDF
- [x] **Commandes livrées → créent automatiquement une Sale pour les rapports**

### 11. Infrastructure
- [x] Docker Compose
- [x] SQLite (dev) / PostgreSQL (prod)
- [x] Render deploy : backend + PostgreSQL
- [x] Vercel deploy : frontend
- [x] Keep-alive ping toutes les 10min (anti-sleep Render free tier)
- [x] ALTER TABLE auto-add columns au démarrage (migrations sans Alembic)
- [x] **Neon** : base de données PostgreSQL gérée via Neon (TablePlus)

### 17. Database Management (Neon)
- [x] Connecté via TablePlus (PostgreSQL)
- [x] CRUD visuel pour users, products, customers, sales, licences
- [x] SQL queries directes pour gestion avancée

---

## 🔲 CE QUI N'EST PAS ENCORE FAIT

### Bugs connus
- [ ] **Session check auto-logout** : ne fonctionne pas encore quand owner désactive un user ou supprime une licence — le user n'est pas délogué automatiquement (60s check + focus ne suffisent pas, à investiguer demain)
- [ ] Service Worker parfois pas à jour (cache v4)
- [ ] Hot-reload peut rater après changements Python

### Priorité Haute
- [x] **Intégrer Google OAuth** — infrastructure prête, nécessite clé API Google
- [x] **Real-time subscriptions** — WebSocket infrastructure prête, nécessite Redis
- [x] **Push notifications** — infrastructure prête, nécessite clé FCM
- [x] **Multi-device** : refresh tokens + auto-rotation

### Priorité Moyenne
- [x] **Test suite** : Jest/Vitest pour frontend, pytest pour backend
- [x] **Produits** : variantes (taille, couleur)
- [x] **Produits** : descriptions riches (texte + images multiples)
- [ ] **Commandes** : suivi livraison en temps réel
- [x] **Client** : historique achats + fidélité
- [x] **Catégories** : hiérarchie (sous-catégories)
- [x] **Paramètres** : couleur primaire personnalisable

### Priorité Basse
- [x] **Multi-langue** : Anglais (3 langues: FR/WO/EN)
- [x] **Thème** : thèmes personnalisables (couleur primaire + 7 presets)
- [x] **Export** : export CSV pour ventes + clients
- [x] **Import** : import clients (CSV)
- [x] **Import** : import ventes (CSV)
- [ ] **Analytics** : graphiques avancés (tendances, comparaison périodes)
- [ ] **WhatsApp** : campagnes de messages (promotions, relances)
- [ ] **IA** : prédictions de stock, recommandations réapprovisionnement
- [ ] **Multi-magasin** : un owner gère plusieurs boutiques
- [ ] **Offline** : queue de sync hors-ligne
- [ ] **Print** : impression personnalisée (logo, en-tête)
- [x] **Sécurité** : refresh tokens + auto-rotation + audit logs

---

## 📝 Notes
- 8GB RAM machine — utiliser `NODE_OPTIONS=--max-old-space-size=4096` pour les builds Vercel
- Le premier login nécessite internet (puis offline sur LAN)
- Toutes les tables sont UUID + tenant_id pour l'isolation multi-tenant
- **2026-06-15** : Render free tier sleep après 15min — keep-alive ajouté
- **2026-06-15** : Comptes avant fix DB PostgreSQL n'existent plus — réinscription nécessaire
- **2026-06-16** : Base de données sur Neon (pas Render PostgreSQL)
- **2026-06-16** : Licence server avec 7j d'essai + activation par clé
- **2026-06-16** : Super admin phones : 776621410, 708372127
- **Contact support** : +221776621410, +221708372127, layedevops@gmail.com, layedevops@gmail.com

## 📞 Support
- 📱 +221 77 662 14 10
- 💬 WhatsApp : +221 70 837 21 27
- 📧 layedevops@gmail.com
- 📧 layedevops@gmail.com
