"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "fr" | "wo";

const translations: Record<string, Record<Lang, string>> = {
  dashboard: { fr: "Tableau de bord", wo: "Tablo bord" },
  pos: { fr: "POS / Vente", wo: "POS / Jënd" },
  sales: { fr: "Ventes", wo: "Jënd yi" },
  reports: { fr: "Rapports", wo: "Rapoor" },
  products: { fr: "Produits", wo: "Produit yi" },
  categories: { fr: "Catégories", wo: "Kaatogoori yi" },
  clients: { fr: "Clients", wo: "Kiliyaan yi" },
  credit: { fr: "Crédit", wo: "Njëg" },
  whatsapp: { fr: "WhatsApp Bot", wo: "Bot WhatsApp" },
  settings: { fr: "Paramètres", wo: "Parametar" },
  logout: { fr: "Déconnexion", wo: "Génn" },
  darkMode: { fr: "Mode sombre", wo: "Mood suuf" },
  lightMode: { fr: "Mode clair", wo: "Mood gaaw" },
  search: { fr: "Rechercher...", wo: "Seet...", },
  add: { fr: "Ajouter", wo: "Bokk" },
  save: { fr: "Enregistrer", wo: "Denc" },
  cancel: { fr: "Annuler", wo: "Bàyyi" },
  delete: { fr: "Supprimer", wo: "Far" },
  edit: { fr: "Modifier", wo: "Soppi" },
  export: { fr: "Exporter", wo: "Séddoo" },
  name: { fr: "Nom", wo: "Tur" },
  phone: { fr: "Téléphone", wo: "Telefon" },
  total: { fr: "Total", wo: "Tërale" },
  stock: { fr: "Stock", wo: "Stock" },
  price: { fr: "Prix", wo: "Njëg" },
  date: { fr: "Date", wo: "Bés" },
  today: { fr: "Aujourd'hui", wo: "Tey" },
  revenue: { fr: "Revenu", wo: "Aar" },
  salesCount: { fr: "Ventes du jour", wo: "Jënd yi tey" },
  lowStock: { fr: "Stock bas", wo: "Stock bi suuf" },
  allGood: { fr: "Tous les stocks sont bons!", wo: "Stock yépp dafa baax!" },
  emptyCart: { fr: "Panier vide", wo: "Panier bi mooy ban" },
  register: { fr: "Enregistrer la vente", wo: "Denc jënd bi" },
  payment: { fr: "Paiement", wo: "Fey" },
  cash: { fr: "Espèces", wo: "Xaalis" },
  wave: { fr: "Wave", wo: "Wave" },
  orange: { fr: "Orange", wo: "Orange" },
  creditPay: { fr: "Crédit", wo: "Njëg" },
  customer: { fr: "Client", wo: "Kiliyaan" },
  passCustomer: { fr: "Client de passage", wo: "Kiliyaan gaaw" },
  newSale: { fr: "Nouvelle vente", wo: "Jënd bu bees" },
  saleDone: { fr: "Vente enregistrée !", wo: "Jënd bi denc na!" },
  printReceipt: { fr: "Imprimer le ticket", wo: "Wëru ticket bi" },
  thanks: { fr: "Mèrsi, dëgg na tànggi!", wo: "Jërëjëf, dëgg na tànggi!" },
  connected: { fr: "Connecté en tant que", wo: "Tërale ci" },
  welcome: { fr: "Bienvenue", wo: "Dalal jàmm" },
  login: { fr: "Se connecter", wo: "Tërale" },
  registerHere: { fr: "Créer un compte", wo: "Sos kont" },
  noProducts: { fr: "Aucun produit", wo: "Amul produit" },
  noResults: { fr: "Aucun résultat", wo: "Amul njëg" },
  loading: { fr: "Chargement...", wo: "Yeesi..." },
  scanBarcode: { fr: "Scanner un code-barres", wo: "Scan code-barres" },
  orders: { fr: "Commandes", wo: "Command yi" },
  storefront: { fr: "Boutique en ligne", wo: "Boutique en ligne" },
  receipt: { fr: "Ticket de caisse", wo: "Ticket bi" },
  sale: { fr: "Vente", wo: "Jënd" },
  product: { fr: "Article", wo: "Produit bi" },
  client: { fr: "Client", wo: "Kiliyaan" },
  billing: { fr: "Abonnement", wo: "Abonnement" },
  loyalty: { fr: "Fidélité", wo: "Fidélité" },
  referral: { fr: "Parrainage", wo: "Parrainage" },
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
    if (saved) setLangState(saved);
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
