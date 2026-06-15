"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3, Settings } from "lucide-react";

const items = [
  { name: "Accueil", href: "/", icon: LayoutDashboard },
  { name: "POS", href: "/pos", icon: ShoppingCart },
  { name: "Produits", href: "/products", icon: Package },
  { name: "Clients", href: "/customers", icon: Users },
  { name: "Rapports", href: "/reports", icon: BarChart3 },
  { name: "Plus", href: "/settings", icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-lg lg:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-primary-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-primary-600" : ""}`} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
