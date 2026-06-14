# Naatal ERP Cloud — TODO Complet

> Dernière mise à jour : 2026-06-14
> Projet : E:\movie laye sow\project\SaaS ERP for Boutique\baay-reseau
> Compte test : 📱 771234567 / 🔑 admin123 (owner, licence 60j)

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
- [x] Rate limiting : 300 req/min (5 pour login)
- [x] CORS : allow all origins
- [x] Licence : date expiration, check dans auth, 403 si expirée

### 2. Frontend (Next.js 14 + Tailwind)
- [x] 24 pages : login, register, dashboard, POS, products, customers, sales, invoices, orders, credit, expenses, reports, categories, settings, whatsapp, storefront, shop/*
- [x] Sidebar : 14 items, bell notification commandes pending
- [x] Top bar : theme toggle, langue (FR/WO), notifications dropdown, profile dropdown
- [x] Mobile : hamburger menu, auto-close sidebar, bottom nav
- [x] AuthGuard : redirect login si pas de token
- [x] Notifications : bell dropdown (nouvelles commandes, stock bas, ruptures)
- [x] 3 thèmes : Light, Dark, Solarized (sauvegardé localStorage)
- [x] i18n : Français + Wolof

### 3. POS
- [x] Panier avec qty +/-, recherche, scan code-barres
- [x] Scanner caméra (html5-qrcode)
- [x] Impression Bluetooth (BLE)
- [x] Impression ESC/POS thermique
- [x] Paiement : Cash, Wave, Orange Money, Crédit
- [x] Lien de paiement Wave/Orange Money (QR code)

### 4. Produits
- [x] CRUD complet avec images
- [x] Upload fichier + URL externe
- [x] Template Excel (téléchargement)
- [x] Import CSV (bulk import)
- [x] Anti-doublon (frontend + backend)
- [x] Sélecteur catégorie (créer + sélectionner)
- [x] Ajustement stock (+/-)
- [x] Toggle en ligne/hors ligne
- [x] Code-barres + scan

### 5. Clients & Crédit
- [x] CRUD clients
- [x] Onglets crédit (borom dënn)
- [x] Paiement crédit
- [x] Dashboard crédit (débiteurs, montants)

### 6. Ventes & Factures
- [x] Historique ventes avec recherche
- [x] Liste factures
- [x] Détail facture A4 (impression PDF)
- [x] Ticket thermique
- [x] product_name sauvegardé dans la DB (pas juste computed)

### 7. Commandes en ligne
- [x] Liste commandes avec statuts (pending/confirmed/delivered/cancelled)
- [x] Bell notification sur sidebar (nombre pending)
- [x] Bell sur chaque commande (pending=orange, confirmed=vert)
- [x] Stock restore si cancelled
- [x] Total du jour exclut les cancelled
- [x] Bon de livraison PDF

### 8. Rapports
- [x] Date range picker personnalisé (du/au)
- [x] KPIs : ventes, revenu, dépenses, bénéfice net
- [x] Graphique répartition paiements
- [x] Top produits
- [x] Export CSV
- [x] Export PDF
- [x] Net profit = (prix_vente - prix_achat) × qté - dépenses

### 9. Dépenses
- [x] 7 catégories : Courant, Loyer, Internet, Transport, Stock, Salaire, Autre
- [x] CRUD dépenses
- [x] Filtre par catégorie
- [x] Résumé mensuel + par catégorie

### 10. Design
- [x] Dark mode + Solarized + Light
- [x] Mobile responsive
- [x] PWA manifest
- [x] Sidebar compacte (14 items sans scroll)
- [x] Profile dropdown dans top bar
- [x] Notifications dropdown dans top bar

### 11. Infrastructure
- [x] Docker Compose
- [x] SQLite (dev) / PostgreSQL (prod)
- [x] Alembic migrations
- [x] Seed script (20 produits, 5 clients, 1 admin)
- [x] Backfill script (product_name dans sale_items)

---

## 🔲 CE QUI N'EST PAS ENCORE FAIT

### Priorité Haute
- [ ] **Deploy Vercel** (frontend) + **Render** (backend)
- [ ] **Intégrer Supabase** (auth + PostgreSQL) — remplacer SQLite
- [ ] **Google OAuth** via Supabase
- [ ] **Real-time subscriptions** (Firestore/WebSocket pour dashboard live)
- [ ] **Push notifications** (FCM pour mobile)
- [ ] **Multi-device** : sync entre appareils

### Priorité Moyenne
- [ ] **Test suite** : Jest/Vitest pour frontend, pytest pour backend
- [ ] **Admin panel** supprimé — à recréer si besoin (gestion users/licence)
- [ ] **Produits** : variantes (taille, couleur)
- [ ] **Produits** : descriptions riches (texte + images multiples)
- [ ] **Commandes** : suivi livraison en temps réel
- [ ] **Client** : historique achats + fidélité
- [ ] **Catégories** : hiérarchie (sous-catégories)
- [ ] **Paramètres** : configuration magasin (logo, devise, langue par défaut)

### Priorité Basse
- [ ] **Multi-langue** : Anglais
- [ ] **Thème** : thèmes personnalisables (couleur primaire)
- [ ] **Export** : export PDF pour toutes les pages
- [ ] **Import** : import clients (CSV)
- [ ] **Import** : import ventes (CSV)
- [ ] **Analytics** : graphiques avancés (tendances, comparaison périodes)
- [ ] **WhatsApp** : campagnes de messages (promotions, relances)
- [ ] **IA** : prédictions de stock, recommandations réapprovisionnement
- [ ] **Multi-magasin** : un owner gère plusieurs boutiques
- [ ] **Offline** : queue de sync hors-ligne
- [ ] **Print** : impression personnalisée (logo, en-tête)
- [ ] **Backup** : export/import base de données
- [ ] **Sécurité** : 2FA, refresh token, audit logs

### Bugs connus
- [ ] Service Worker parfois pas à jour (cache v4)
- [ ] Hot-reload peut rater après changements Python
- [ ] Import CSV : pas de validation avancée (format attendu exact)

---

## 📁 Fichiers Backup
- `backend/app/core/config.py.bak`
- `backend/app/main.py.bak`
- `frontend/public/sw.js.bak`

## 📝 Notes
- 8GB RAM machine — utiliser `NODE_OPTIONS=--max-old-space-size=4096` pour les builds
- Le premier login nécessite internet (puis offline sur LAN)
- Toutes les tables sont UUID + tenant_id pour l'isolation multi-tenant
