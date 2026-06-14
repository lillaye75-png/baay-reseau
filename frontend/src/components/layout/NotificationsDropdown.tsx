"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, ShoppingCart, Package, AlertTriangle, CheckCircle, X } from "lucide-react";
import api from "@/lib/api";
import { formatDateTime } from "@/lib/format";

interface Notification {
  id: string;
  type: "order" | "low_stock" | "credit" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        api.get("/storefront/orders").catch(() => ({ data: [] })),
        api.get("/products/").catch(() => ({ data: [] })),
      ]);

      const notifs: Notification[] = [];

      ordersRes.data.forEach((order: any) => {
        if (order.status === "pending") {
          notifs.push({
            id: `order-${order.id}`,
            type: "order",
            title: "Nouvelle commande",
            message: `${order.customer_name} — ${order.total_cfa.toLocaleString()} CFA`,
            time: order.created_at,
            read: false,
          });
        }
        if (order.status === "confirmed") {
          notifs.push({
            id: `confirmed-${order.id}`,
            type: "info",
            title: "Commande confirmée",
            message: `#${order.id.slice(0, 8).toUpperCase()} — ${order.customer_name}`,
            time: order.created_at,
            read: true,
          });
        }
      });

      productsRes.data.forEach((product: any) => {
        if (product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0) {
          notifs.push({
            id: `stock-${product.id}`,
            type: "low_stock",
            title: "Stock bas",
            message: `${product.name} — ${product.stock_quantity} restant(s)`,
            time: product.updated_at || new Date().toISOString(),
            read: false,
          });
        }
        if (product.stock_quantity === 0) {
          notifs.push({
            id: `out-${product.id}`,
            type: "low_stock",
            title: "Rupture de stock",
            message: product.name,
            time: product.updated_at || new Date().toISOString(),
            read: false,
          });
        }
      });

      notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(notifs.slice(0, 20));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const iconMap = {
    order: <ShoppingCart className="h-4 w-4 text-blue-500" />,
    low_stock: <AlertTriangle className="h-4 w-4 text-orange-500" />,
    credit: <Package className="h-4 w-4 text-red-500" />,
    info: <CheckCircle className="h-4 w-4 text-green-500" />,
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 z-50">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                Aucune notification
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    !notif.read ? "bg-primary-50/50 dark:bg-primary-900/10" : ""
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {iconMap[notif.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${!notif.read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-primary-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(notif.time)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                    className="text-gray-400 hover:text-gray-600 mt-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
              <button
                onClick={() => { setOpen(false); markAllRead(); }}
                className="w-full text-center text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                {notifications.length} notification(s) — tout marquer lu
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
