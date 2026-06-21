"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatCFA, formatDateTime } from "@/lib/format";
import { CheckCircle, Clock, Truck, Package, ArrowLeft, MapPin, Phone } from "lucide-react";

interface TrackingStep {
  status: string;
  label: string;
  done: boolean;
}

interface TrackingData {
  order_id: string;
  status: string;
  tracking_status: string | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  driver_name: string | null;
  total_cfa: number;
  tracking_steps: TrackingStep[];
}

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

export default function OrderPage() {
  const params = useParams();
  const slug = (params?.slug || "") as string;
  const orderId = (params?.id || "") as string;
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/v1/shop/store/${slug}/order/${orderId}/tracking`).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/v1/shop/store/${slug}/order/${orderId}`).then(r => r.ok ? r.json() : null),
    ])
      .then(([trackingData, orderData]) => {
        if (trackingData) setTracking(trackingData);
        if (orderData) setOrder(orderData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, orderId, API]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!order && !tracking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Commande introuvable</p>
      </div>
    );
  }

  const steps = tracking?.tracking_steps || [
    { status: "pending", label: "Commande reçue", done: true },
    { status: "confirmed", label: "Confirmée", done: ["confirmed", "shipped", "out_for_delivery", "delivered"].includes(order?.status || "") },
    { status: "shipped", label: "En préparation", done: ["shipped", "out_for_delivery", "delivered"].includes(order?.status || "") },
    { status: "out_for_delivery", label: "En livraison", done: ["out_for_delivery", "delivered"].includes(order?.status || "") },
    { status: "delivered", label: "Livrée", done: order?.status === "delivered" },
  ];

  const orderData = order || {} as OrderData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            tracking?.status === "delivered" ? "bg-green-100" : "bg-primary-100"
          }`}>
            {tracking?.status === "delivered" ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <Package className="h-8 w-8 text-primary-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {tracking?.status === "delivered" ? "Commande livrée !" : "Suivi de commande"}
          </h1>
          <p className="text-gray-500 mt-1">Commande #{orderId.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Progression</h3>
          <div className="relative">
            {steps.map((step, i) => (
              <div key={step.status} className="flex items-start gap-3 pb-6 last:pb-0">
                <div className="relative flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                    step.done
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}>
                    {step.done ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-xs font-medium">{i + 1}</span>
                    )}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-0.5 h-full min-h-[24px] absolute top-8 ${
                      step.done ? "bg-green-500" : "bg-gray-200"
                    }`} />
                  )}
                </div>
                <div className="pt-1">
                  <p className={`text-sm font-medium ${step.done ? "text-gray-900" : "text-gray-400"}`}>
                    {step.label}
                  </p>
                  {step.done && i === steps.filter(s => s.done).length - 1 && (
                    <p className="text-xs text-green-600 mt-0.5">Terminé</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Driver Info */}
        {tracking?.driver_name && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Livreur: {tracking.driver_name}</p>
                {tracking.estimated_delivery && (
                  <p className="text-xs text-gray-500">
                    Arrivée estimée: {formatDateTime(tracking.estimated_delivery)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span>{formatDateTime(orderData.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Paiement</span>
              <span className="capitalize">{orderData.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Livraison</span>
              <span>{orderData.delivery_method === "delivery" ? "Livraison à domicile" : "Retrait en boutique"}</span>
            </div>
          </div>
        </div>

        {/* Items */}
        {orderData.items && orderData.items.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Articles</h3>
            <div className="space-y-2">
              {orderData.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.product_name} × {item.quantity}</span>
                  <span className="font-medium">{formatCFA(item.total_cfa)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary-600">{formatCFA(tracking?.total_cfa || orderData.total_cfa)}</span>
              </div>
            </div>
          </div>
        )}

        <Link href={`/shop/${slug}`} className="block w-full text-center rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
          Retour à la boutique
        </Link>
      </div>
    </div>
  );
}
