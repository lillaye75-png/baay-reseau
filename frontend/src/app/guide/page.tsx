"use client";

import { Printer } from "lucide-react";

const sections = [
  {
    title: "Bienvenue sur Naatal ERP Cloud",
    content: `Naatal ERP Cloud est une solution complète de gestion de boutique pour le Sénégal et l'Afrique de l'Ouest. Cette application vous permet de gérer vos ventes, stock, clients, commandes en ligne, et bien plus encore — le tout depuis un seul endroit, même hors connexion.`
  },
  {
    title: "1. Tableau de bord",
    content: `Le tableau de bord est votre vue d'ensemble. Vous y trouverez :
• Ventes du jour (total, espèces, Wave, crédit)
• Nombre de commandes en attente
• Alertes de stock bas
• Graphique des ventes hebdomadaires
• Meilleurs produits vendus`
  },
  {
    title: "2. Point de Vente (POS)",
    content: `Le POS est votre caisse principale. Fonctionnalités :
• Scanner code-barres avec la caméra
• Recherche rapide de produits par nom
• Gestion des remises (% ou montant fixe)
• Modes de paiement : Espèces, Wave, Orange Money, Crédit
• Rendu monnaie automatique
• Impression de tickets thermiques
• Ventes en attente (reprendre plus tard)`
  },
  {
    title: "3. Vente Rapide",
    content: `Pour les ventes sans produit catalogué :
• Saisissez le nom du produit, le prix, la quantité
• Idéal pour les produits ponctuels ou les services
• Le stock n'est pas affecté`
  },
  {
    title: "4. Gestion des Produits",
    content: `Ajoutez et gérez votre catalogue :
• Nom, prix de vente, prix d'achat
• Code-barres (scanner ou saisir manuellement)
• Catégories et sous-catégories
• Seuil d'alerte stock minimum
• Import CSV/Excel de vos produits
• Images via Cloudinary
• Description riche pour chaque produit
• Produits dormant (sans mouvement)`
  },
  {
    title: "5. Gestion des Clients",
    content: `Suivez vos clients :
• Fiche client avec nom, téléphone, historique
• Système de crédit (takk/liggéey)
• Vue des clients endettés
• Remboursement de crédit
• Export CSV/Excel de la liste clients`
  },
  {
    title: "6. Ventes & Factures",
    content: `Consultez l'historique de vos ventes :
• Liste des ventes avec filtres (date, paiement, client)
• Détail de chaque vente (articles, totaux)
• Impression A4 avec logo personnalisé
• Annulation de facture (propriétaire uniquement)
• Export CSV/Excel`
  },
  {
    title: "7. Commandes en Ligne",
    content: `Gérez les commandes de votre boutique en ligne :
• Liste des commandes par statut (en attente, confirmée, livrée)
• Mise à jour du statut avec notifications
• Suivi de livraison avec livreur
• Lien de suivi public pour les clients`
  },
  {
    title: "8. Dépenses",
    content: `Enregistrez vos dépenses :
• Catégories : Loyer, Salaires, Fournitures, Électricité, etc.
• Date, montant, description
• Justificatif photo (optionnel)
• Rapport mensuel des dépenses`
  },
  {
    title: "9. Rapports & Analyses",
    content: `Analyses détaillées de votre activité :
• Rapport de ventes (journalier, hebdo, mensuel)
• Top produits vendus
• Tendances sur 30 jours
• Comparaison de deux périodes
• Prédictions IA de stock (alertes, réapprovisionnement)`
  },
  {
    title: "10. Boutique en Ligne",
    content: `Configurez votre boutique publique :
• URL personnalisée : pharmacloud.app/shop/votre-slug
• Paramètres : bannière, couleurs, description
• Toggle produits visibles/online
• Gestion des commandes reçues
• Paramètres de livraison et paiement`
  },
  {
    title: "11. WhatsApp Bot",
    content: `Gérez votre boutique par message WhatsApp :
• Configurez votre clé API Meta WhatsApp Business
• Bot IA qui comprend le Wolof, Français et Anglais
• Ventes, stock, crédit, rapports par message
• Campagnes de messages aux clients`
  },
  {
    title: "12. Paramètres",
    content: `Personnalisez votre application :
• Informations de la boutique (nom, téléphone, email)
• URL de la boutique en ligne
• Configuration WhatsApp et paiements
• Gestion de l'équipe (ajouter/retirer employés)
• Couleur et thème de l'application
• Paramètres d'impression (logo, en-tête, pied de page)
• Backup et restauration des données`
  },
  {
    title: "13. Multi-Boutiques",
    content: `Gérez plusieurs points de vente :
• Créer de nouvelles boutiques depuis Paramètres > Mes Boutiques
• Basculer entre les boutiques
• Chaque boutique a ses propres données`
  },
  {
    title: "14. Mode Hors Ligne",
    content: `Continuez à travailler sans internet :
• Les ventes sont enregistrées localement
• Synchronisation automatique à la reconnexion
• Produits mis en cache pour consultation hors ligne
• Indicateur de statut : 🟢 En ligne | 🔴 Hors ligne`
  },
  {
    title: "15. Rôles & Permissions",
    content: `Trois niveaux d'accès :
• Propriétaire : accès complet (ventes, paramètres, suppression)
• Manager : ventes, stock, commandes, rapports
• Employé : ventes uniquement, consultation stock
Les employés ne peuvent PAS modifier/supprimer les factures.`
  },
  {
    title: "16. Raccourcis & Astuces",
    content: `• Ctrl+K : Recherche rapide (si disponible)
• Scanner code-barres : utilisez la caméra ou une douchette USB
• Vente rapide : pour les produits non catalogués
• Mode hors ligne : les ventes se synchronisent automatiquement
• Backup régulier : Paramètres > Données > Télécharger backup`
  },
];

export default function GuidePage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="print:hidden flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Guide Utilisateur</h1>
            <p className="text-gray-500 mt-1">Naatal ERP Cloud — Documentation complète</p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimer / PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12" id="guide-content">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Naatal ERP Cloud</h1>
            <p className="text-xl text-gray-500">Guide Utilisateur Complet</p>
            <p className="text-sm text-gray-400 mt-2">Version 2.0 — Juin 2026</p>
          </div>

          <div className="space-y-8">
            {sections.map((section, i) => (
              <div key={i} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{section.title}</h2>
                <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Besoin d&apos;aide ? Contactez-nous :
            </p>
            <p className="text-sm text-gray-700 mt-1">
              📱 +221 77 662 14 10 | 💬 WhatsApp : +221 70 837 21 27 | 📧 layedevops@gmail.com
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #guide-content, #guide-content * { visibility: visible; }
          #guide-content { position: absolute; left: 0; top: 0; width: 100%; padding: 20mm; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
