"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { formatCFA, formatDateTime } from "@/lib/format";
import api from "@/lib/api";
import { Package, Clock, CheckCircle, Truck, X, Eye, Printer, Bell, MapPin, User, Phone } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price_cfa: number;
  total_cfa: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_notes: string | null;
  total_cfa: number;
  payment_method: string;
  status: string;
  delivery_method: string;
  tracking_status: string | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  created_at: string;
  items: OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "En attente", color: "warning", icon: Clock },
  confirmed: { label: "Confirmée", color: "success", icon: CheckCircle },
  shipped: { label: "Expédiée", color: "info", icon: Package },
  out_for_delivery: { label: "En livraison", color: "info", icon: Truck },
  delivered: { label: "Livrée", color: "success", icon: Truck },
  cancelled: { label: "Annulée", color: "danger", icon: X },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showTracking, setShowTracking] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    tracking_status: "",
    estimated_delivery: "",
    driver_name: "",
    driver_phone: "",
  });

  useEffect(() => {
    api.get("/storefront/orders")
      .then((res) => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "WebSocket" in window) {
      const wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace("http", "ws") || "ws://localhost:8000";
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.tenant_id) return;
      const ws = new WebSocket(`${wsUrl}/ws/${user.tenant_id}`);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "new_order" || msg.type === "order_update") {
          api.get("/storefront/orders").then((res) => setOrders(res.data));
        }
      };
      return () => ws.close();
    }
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/storefront/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
      showToast(`Commande ${status === "confirmed" ? "confirmée" : status === "delivered" ? "livrée" : status === "shipped" ? "expédiée" : "annulée"}`);
      setSelectedOrder(null);
    } catch { showToast("Erreur", "error"); }
  };

  const updateTracking = async (orderId: string) => {
    try {
      await api.put(`/storefront/orders/${orderId}/tracking`, trackingForm);
      api.get("/storefront/orders").then((res) => setOrders(res.data));
      showToast("Suivi mis à jour !");
      setShowTracking(false);
    } catch { showToast("Erreur", "error"); }
  };

  const openTrackingForm = (order: Order) => {
    setTrackingForm({
      tracking_status: order.tracking_status || "",
      estimated_delivery: order.estimated_delivery ? order.estimated_delivery.slice(0, 16) : "",
      driver_name: order.driver_name || "",
      driver_phone: order.driver_phone || "",
    });
    setShowTracking(true);
  };

  const printOrder = (order: Order) => {
    const html = `
      <html><head><title>Bon de livraison ${order.id.slice(0,8).toUpperCase()}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        h1 { font-size: 20px; margin-bottom: 5px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
        .meta { display: flex; gap: 20px; margin-bottom: 15px; font-size: 13px; }
        .meta div { background: #f3f4f6; padding: 8px 12px; border-radius: 6px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background: #f3f4f6; padding: 8px; text-align: left; font-size: 12px; border-bottom: 2px solid #ddd; }
        td { padding: 8px; border-bottom: 1px solid #eee; font-size: 13px; }
        .total { text-align: right; font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 8px; }
        .footer { margin-top: 20px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
        .note { background: #fef3c7; border: 1px solid #fbbf24; padding: 10px; border-radius: 6px; margin-top: 15px; font-size: 12px; }
        @media print { body { padding: 10px; } }
      </style></head><body>
      <div class="header">
        <h1>Bon de livraison</h1>
        <p style="color:#666;font-size:13px;">Commande N° ${order.id.slice(0,8).toUpperCase()}</p>
      </div>
      <div class="meta">
        <div><strong>Client:</strong> ${order.customer_name}<br>Tél: ${order.customer_phone}</div>
        <div><strong>Adresse:</strong><br>${order.customer_address}</div>
        <div><strong>Date:</strong> ${formatDateTime(order.created_at)}<br><strong>Paiement:</strong> ${order.payment_method}</div>
      </div>
      <table>
        <thead><tr><th>Article</th><th style="text-align:center">Qté</th><th style="text-align:right">Prix</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>
          ${order.items.map(item => `<tr><td>${item.product_name}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">${formatCFA(item.unit_price_cfa)}</td><td style="text-align:right;font-weight:bold">${formatCFA(item.total_cfa)}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="total">TOTAL: ${formatCFA(order.total_cfa)}</div>
      ${order.customer_notes ? `<div class="note"><strong>Notes:</strong> ${order.customer_notes}</div>` : ''}
      ${order.driver_name ? `<div style="margin-top:15px;padding:10px;background:#e0f2fe;border-radius:6px;font-size:12px"><strong>Livreur:</strong> ${order.driver_name} ${order.driver_phone ? `- ${order.driver_phone}` : ''}</div>` : ''}
      <div class="footer">Naatal ERP Cloud — ERP Boutique | Bon de livraison pour le livreur</div>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length;
  const shippedCount = orders.filter((o) => o.status === "shipped" || o.status === "out_for_delivery").length;
  const todayTotal = orders
    .filter((o) => {
      const d = new Date(o.created_at);
      const today = new Date();
      return d.toDateString() === today.toDateString() && o.status !== "cancelled";
    })
    .reduce((s, o) => s + o.total_cfa, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Commandes en ligne</h1>
            <p className="text-sm text-gray-500">{orders.length} commandes | {pendingCount} en attente | {shippedCount} en cours</p>
          </div>
          <Card className="!p-0">
            <CardContent className="flex items-center gap-3 px-4 py-2">
              <Package className="h-4 w-4 text-primary-600" />
              <div>
                <p className="text-xs text-gray-500">Aujourd&apos;hui</p>
                <p className="text-sm font-bold">{formatCFA(todayTotal)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedOrder && (
          <Card className="border-primary-200 bg-primary-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Commande #{selectedOrder.id.slice(0, 8).toUpperCase()}</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div><span className="text-gray-500">Client:</span> <span className="font-medium">{selectedOrder.customer_name}</span></div>
                <div><span className="text-gray-500">Tél:</span> <span className="font-medium">{selectedOrder.customer_phone}</span></div>
                <div className="col-span-2"><span className="text-gray-500">Adresse:</span> <span className="font-medium">{selectedOrder.customer_address}</span></div>
                {selectedOrder.driver_name && (
                  <div className="col-span-2"><span className="text-gray-500">Livreur:</span> <span className="font-medium">{selectedOrder.driver_name} {selectedOrder.driver_phone ? `- ${selectedOrder.driver_phone}` : ''}</span></div>
                )}
                {selectedOrder.estimated_delivery && (
                  <div className="col-span-2"><span className="text-gray-500">Livraison estimée:</span> <span className="font-medium">{formatDateTime(selectedOrder.estimated_delivery)}</span></div>
                )}
              </div>
              <div className="rounded-lg bg-white border border-gray-200 p-3 mb-4">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span>{item.product_name} × {item.quantity}</span>
                    <span className="font-medium">{formatCFA(item.total_cfa)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCFA(selectedOrder.total_cfa)}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {selectedOrder.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "confirmed")}>Confirmer</Button>
                    <Button size="sm" variant="danger" onClick={() => updateStatus(selectedOrder.id, "cancelled")}>Annuler</Button>
                  </>
                )}
                {selectedOrder.status === "confirmed" && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "shipped")}>Expédier</Button>
                    <Button size="sm" variant="secondary" onClick={() => openTrackingForm(selectedOrder)}>
                      <MapPin className="h-3 w-3 mr-1" /> Suivi
                    </Button>
                  </>
                )}
                {(selectedOrder.status === "shipped" || selectedOrder.status === "out_for_delivery") && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "delivered")}>Marquer livrée</Button>
                    <Button size="sm" variant="secondary" onClick={() => openTrackingForm(selectedOrder)}>
                      <MapPin className="h-3 w-3 mr-1" /> Suivi
                    </Button>
                  </>
                )}
                <Button size="sm" variant="secondary" onClick={() => printOrder(selectedOrder)}>
                  <Printer className="h-3 w-3 mr-1" /> Bon
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showTracking && selectedOrder && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Mettre à jour le suivi</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Statut suivi</label>
                  <select
                    value={trackingForm.tracking_status}
                    onChange={(e) => setTrackingForm({ ...trackingForm, tracking_status: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mt-1"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="preparing">En préparation</option>
                    <option value="picked_up">Récupéré</option>
                    <option value="in_transit">En transit</option>
                    <option value="nearby">À proximité</option>
                    <option value="delivered">Livré</option>
                  </select>
                </div>
                <Input
                  label="Livraison estimée"
                  type="datetime-local"
                  value={trackingForm.estimated_delivery}
                  onChange={(e) => setTrackingForm({ ...trackingForm, estimated_delivery: e.target.value })}
                />
                <Input
                  label="Nom du livreur"
                  value={trackingForm.driver_name}
                  onChange={(e) => setTrackingForm({ ...trackingForm, driver_name: e.target.value })}
                  placeholder="Nom du livreur"
                />
                <Input
                  label="Téléphone du livreur"
                  value={trackingForm.driver_phone}
                  onChange={(e) => setTrackingForm({ ...trackingForm, driver_phone: e.target.value })}
                  placeholder="+221..."
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => updateTracking(selectedOrder.id)}>Enregistrer</Button>
                <Button size="sm" variant="secondary" onClick={() => setShowTracking(false)}>Annuler</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          {loading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune commande</p>
              <p className="text-sm text-gray-400">Activez votre boutique en ligne pour recevoir des commandes</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order) => {
                const st = statusConfig[order.status] || statusConfig.pending;
                return (
                  <div key={order.id} className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between" onClick={() => setSelectedOrder(order)}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{order.customer_name}</span>
                        <Badge variant={st.color as any}>{st.label}</Badge>
                        {order.tracking_status && (
                          <Badge variant="info">{order.tracking_status}</Badge>
                        )}
                        {order.status === "pending" && (
                          <Bell className="h-4 w-4 text-orange-500 animate-pulse" />
                        )}
                        {(order.status === "shipped" || order.status === "out_for_delivery") && (
                          <Truck className="h-4 w-4 text-blue-500 animate-bounce" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{formatDateTime(order.created_at)} · {order.items.length} article(s) {order.driver_name ? `· Livreur: ${order.driver_name}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCFA(order.total_cfa)}</p>
                      <p className="text-xs text-gray-400">{order.payment_method}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
