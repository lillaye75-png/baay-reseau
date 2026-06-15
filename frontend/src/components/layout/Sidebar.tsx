"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  CreditCard,
  Receipt,
  BarChart3,
  Store,
  ShoppingBag,
  Crown,
  Wallet,
  Key,
} from "lucide-react";
import api from "@/lib/api";

const navigation = [
  { name: "Tableau de bord", href: "/", icon: LayoutDashboard, i18nKey: "dashboard" },
  { name: "POS / Vente", href: "/pos", icon: ShoppingCart, i18nKey: "pos" },
  { name: "Ventes & Factures", href: "/sales", icon: Receipt, i18nKey: "sales" },
  { name: "Commandes", href: "/orders", icon: ShoppingBag, i18nKey: "orders", showBadge: true },
  { name: "Dépenses", href: "/expenses", icon: Wallet, i18nKey: "expenses" },
  { name: "Rapports", href: "/reports", icon: BarChart3, i18nKey: "reports" },
  { name: "Produits", href: "/products", icon: Package, i18nKey: "products" },
  { name: "Clients", href: "/customers", icon: Users, i18nKey: "clients" },
  { name: "Crédit", href: "/credit", icon: CreditCard, i18nKey: "credit" },
  { name: "Abonnement", href: "/billing", icon: Crown, i18nKey: "billing" },
  { name: "Paramètres", href: "/settings", icon: Settings, i18nKey: "settings" },
];

const superAdminNav = [
  { name: "Licences", href: "/licences", icon: Key, i18nKey: "licences" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useI18n();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (user?.phone && ["776621410", "708372127"].includes(user.phone)) {
      setIsSuperAdmin(true);
    }
  }, [user]);

  useEffect(() => {
    const fetchPending = () => {
      api.get("/storefront/orders")
        .then((res) => {
          const pending = res.data.filter((o: any) => o.status === "pending");
          setPendingCount(pending.length);
        })
        .catch(() => {});
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full w-60 flex-col bg-gray-900 text-white">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold shadow-lg">
          BR
        </div>
        <div>
          <h1 className="text-sm font-semibold">Naatal ERP Cloud</h1>
          <p className="text-[11px] text-gray-400">ERP Boutique</p>
        </div>
      </div>

      {user && (
        <div className="mx-3 mb-2 rounded-lg bg-gray-800/50 px-3 py-2">
          <p className="text-[11px] text-gray-400">{t("connected")}</p>
          <p className="text-xs font-medium text-white truncate">{user.name}</p>
        </div>
      )}

      <nav className="flex flex-1 flex-col justify-evenly px-3 py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary-600 text-white shadow-md shadow-primary-600/25"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{t(item.i18nKey)}</span>
              {item.showBadge && pendingCount > 0 && (
                <span className="absolute right-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg animate-pulse">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
        {isSuperAdmin && superAdminNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-yellow-600 text-white shadow-md shadow-yellow-600/25"
                  : "text-yellow-400 hover:bg-gray-800 hover:text-yellow-300"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{t(item.i18nKey) || item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
