"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "fr" | "wo" | "en";

const translations: Record<string, Record<Lang, string>> = {
  dashboard: { fr: "Tableau de bord", wo: "Tablo bord", en: "Dashboard" },
  pos: { fr: "POS / Vente", wo: "POS / Jënd", en: "POS / Sale" },
  sales: { fr: "Ventes", wo: "Jënd yi", en: "Sales" },
  reports: { fr: "Rapports", wo: "Rapoor", en: "Reports" },
  products: { fr: "Produits", wo: "Produit yi", en: "Products" },
  categories: { fr: "Catégories", wo: "Kaatogoori yi", en: "Categories" },
  clients: { fr: "Clients", wo: "Kiliyaan yi", en: "Customers" },
  credit: { fr: "Crédit", wo: "Njëg", en: "Credit" },
  whatsapp: { fr: "WhatsApp Bot", wo: "Bot WhatsApp", en: "WhatsApp Bot" },
  settings: { fr: "Paramètres", wo: "Parametar", en: "Settings" },
  logout: { fr: "Déconnexion", wo: "Génn", en: "Logout" },
  darkMode: { fr: "Mode sombre", wo: "Mood suuf", en: "Dark mode" },
  lightMode: { fr: "Mode clair", wo: "Mood gaaw", en: "Light mode" },
  search: { fr: "Rechercher...", wo: "Seet...", en: "Search..." },
  add: { fr: "Ajouter", wo: "Bokk", en: "Add" },
  save: { fr: "Enregistrer", wo: "Denc", en: "Save" },
  cancel: { fr: "Annuler", wo: "Bàyyi", en: "Cancel" },
  delete: { fr: "Supprimer", wo: "Far", en: "Delete" },
  edit: { fr: "Modifier", wo: "Soppi", en: "Edit" },
  export: { fr: "Exporter", wo: "Séddoo", en: "Export" },
  name: { fr: "Nom", wo: "Tur", en: "Name" },
  phone: { fr: "Téléphone", wo: "Telefon", en: "Phone" },
  total: { fr: "Total", wo: "Tërale", en: "Total" },
  stock: { fr: "Stock", wo: "Stock", en: "Stock" },
  price: { fr: "Prix", wo: "Njëg", en: "Price" },
  date: { fr: "Date", wo: "Bés", en: "Date" },
  today: { fr: "Aujourd'hui", wo: "Tey", en: "Today" },
  revenue: { fr: "Revenu", wo: "Aar", en: "Revenue" },
  salesCount: { fr: "Ventes du jour", wo: "Jënd yi tey", en: "Today's sales" },
  lowStock: { fr: "Stock bas", wo: "Stock bi suuf", en: "Low stock" },
  allGood: { fr: "Tous les stocks sont bons!", wo: "Stock yépp dafa baax!", en: "All stocks are good!" },
  emptyCart: { fr: "Panier vide", wo: "Panier bi mooy ban", en: "Empty cart" },
  register: { fr: "Enregistrer la vente", wo: "Denc jënd bi", en: "Record sale" },
  payment: { fr: "Paiement", wo: "Fey", en: "Payment" },
  cash: { fr: "Espèces", wo: "Xaalis", en: "Cash" },
  wave: { fr: "Wave", wo: "Wave", en: "Wave" },
  orange: { fr: "Orange", wo: "Orange", en: "Orange" },
  creditPay: { fr: "Crédit", wo: "Njëg", en: "Credit" },
  customer: { fr: "Client", wo: "Kiliyaan", en: "Customer" },
  passCustomer: { fr: "Client de passage", wo: "Kiliyaan gaaw", en: "Walk-in customer" },
  newSale: { fr: "Nouvelle vente", wo: "Jënd bu bees", en: "New sale" },
  saleDone: { fr: "Vente enregistrée !", wo: "Jënd bi denc na!", en: "Sale recorded!" },
  printReceipt: { fr: "Imprimer le ticket", wo: "Wëru ticket bi", en: "Print receipt" },
  thanks: { fr: "Mèrsi, dëgg na tànggi!", wo: "Jërëjëf, dëgg na tànggi!", en: "Thanks, see you soon!" },
  connected: { fr: "Connecté en tant que", wo: "Tërale ci", en: "Logged in as" },
  welcome: { fr: "Bienvenue", wo: "Dalal jàmm", en: "Welcome" },
  login: { fr: "Se connecter", wo: "Tërale", en: "Login" },
  registerHere: { fr: "Créer un compte", wo: "Sos kont", en: "Create account" },
  noProducts: { fr: "Aucun produit", wo: "Amul produit", en: "No products" },
  noResults: { fr: "Aucun résultat", wo: "Amul njëg", en: "No results" },
  loading: { fr: "Chargement...", wo: "Yeesi...", en: "Loading..." },
  scanBarcode: { fr: "Scanner un code-barres", wo: "Scan code-barres", en: "Scan barcode" },
  orders: { fr: "Commandes", wo: "Command yi", en: "Orders" },
  invoices: { fr: "Factures", wo: "Fatuur yi", en: "Invoices" },
  expenses: { fr: "Dépenses", wo: "Jënd yi", en: "Expenses" },
  storefront: { fr: "Boutique en ligne", wo: "Boutique en ligne", en: "Online store" },
  receipt: { fr: "Ticket de caisse", wo: "Ticket bi", en: "Receipt" },
  sale: { fr: "Vente", wo: "Jënd", en: "Sale" },
  product: { fr: "Article", wo: "Produit bi", en: "Product" },
  client: { fr: "Client", wo: "Kiliyaan", en: "Customer" },
  billing: { fr: "Abonnement", wo: "Abonnement", en: "Billing" },
  loyalty: { fr: "Fidélité", wo: "Fidélité", en: "Loyalty" },
  referral: { fr: "Parrainage", wo: "Parrainage", en: "Referral" },
  shop: { fr: "Boutique publique", wo: "Boutique wi", en: "Public shop" },
  quick_sale: { fr: "Vente Rapide", wo: "Jënd gaaw", en: "Quick Sale" },
  licences: { fr: "Licences", wo: "Licences", en: "Licences" },
  audit_log: { fr: "Journal d'activités", wo: "Journal", en: "Audit Log" },
  variants: { fr: "Variantes", wo: "Variant yi", en: "Variants" },
};

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang;
    if (saved && ["fr", "wo", "en"].includes(saved)) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const t = (key: string): string => {
    return translations[key]?.[lang] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
