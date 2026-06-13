"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatCFA, formatDateTime } from "@/lib/format";
import { CheckCircle, Clock, Truck, Package, ArrowLeft } from "lucide-react";

interface OrderData {
  id: string;
  customer_name: string;
  total_cfa: number;
  status: string;
  payment_method: string;
  delivery_method: string;
  created_at: string;
  items: { product_name: string; quantity: number; unit_price_cfa: number; total_cfa: number }[];
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "En attente", icon: Clock, color: "text-yellow-600 bg-yellow-100" },
  confirmed: { label: "Confirmée", icon: CheckCircle, color: "text-blue-600 bg-blue-100" },
  delivered: { label: "Livrée", icon: Truck, color: "text-green-600 bg-green-100" },
  cancelled: { label: "Annulée", icon: Package, color: "text-red-600 bg-red-100" },
};

export default function OrderPage() {
  const params = useParams();
  const slug = (params?.slug || "") as string;
  const orderId = (params?.id || "") as string;
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${API}/api/v1/shop/store/${slug}/order/${orderId}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Commande introuvable</p>
      </div>
    );
  }

  const st = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = st.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Commande confirmée !</h1>
          <p className="text-gray-500 mt-1">Merci {order.customer_name}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Statut</span>
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${st.color}`}>
              <StatusIcon className="h-3 w-3" /> {st.label}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Commande #</span>
              <span className="font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span>{formatDateTime(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Paiement</span>
              <span className="capitalize">{order.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Livraison</span>
              <span>{order.delivery_method === "delivery" ? "Livraison" : "Retrait"}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Articles</h3>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.product_name} × {item.quantity}</span>
                <span className="font-medium">{formatCFA(item.total_cfa)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary-600">{formatCFA(order.total_cfa)}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500 text-center mb-4">
          Vous serez contacté(e) pour confirmer la livraison.
        </p>

        <Link href={`/shop/${slug}`} className="block w-full text-center rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
          Retour à la boutique
        </Link>
      </div>
    </div>
  );
}
