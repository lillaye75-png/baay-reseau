"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useI18n } from "@/lib/i18n";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  CreditCard,
  Receipt,
  Folder,
  BarChart3,
  Sun,
  Moon,
  Store,
  ShoppingBag,
  Crown,
  Gift,
} from "lucide-react";

const navigation = [
  { name: "Tableau de bord", href: "/", icon: LayoutDashboard, i18nKey: "dashboard" },
  { name: "POS / Vente", href: "/pos", icon: ShoppingCart, i18nKey: "pos" },
  { name: "Ventes", href: "/sales", icon: Receipt, i18nKey: "sales" },
  { name: "Commandes", href: "/orders", icon: ShoppingBag, i18nKey: "orders" },
  { name: "Rapports", href: "/reports", icon: BarChart3, i18nKey: "reports" },
  { name: "Produits", href: "/products", icon: Package, i18nKey: "products" },
  { name: "Catégories", href: "/categories", icon: Folder, i18nKey: "categories" },
  { name: "Clients", href: "/customers", icon: Users, i18nKey: "clients" },
  { name: "Crédit", href: "/credit", icon: CreditCard, i18nKey: "credit" },
  { name: "Boutique en ligne", href: "/storefront", icon: Store, i18nKey: "storefront" },
  { name: "WhatsApp Bot", href: "/whatsapp", icon: MessageSquare, i18nKey: "whatsapp" },
  { name: "Abonnement", href: "/billing", icon: Crown, i18nKey: "billing" },
  { name: "Parrainage", href: "/referral", icon: Gift, i18nKey: "referral" },
  { name: "Paramètres", href: "/settings", icon: Settings, i18nKey: "settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const { lang, setLang, t } = useI18n();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold shadow-lg">
          BR
        </div>
        <div>
          <h1 className="text-sm font-semibold">Baay Réseau</h1>
          <p className="text-xs text-gray-400">ERP Boutique</p>
        </div>
      </div>

      {user && (
        <div className="mx-3 mb-2 rounded-lg bg-gray-800/50 px-3 py-2">
          <p className="text-xs text-gray-400">Connecté en tant que</p>
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
        </div>
      )}

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary-600 text-white shadow-md shadow-primary-600/25"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {t(item.i18nKey)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-3 space-y-1">
        <button
          onClick={() => setLang(lang === "fr" ? "wo" : "fr")}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white w-full transition-colors"
        >
          <span className="text-lg">{lang === "fr" ? "🇸🇳" : "🇫🇷"}</span>
          {lang === "fr" ? "Wolof" : "Français"}
        </button>
        <button
          onClick={toggle}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white w-full transition-colors"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {dark ? t("lightMode") : t("darkMode")}
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
