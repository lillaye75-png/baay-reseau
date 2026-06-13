"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatCFA } from "@/lib/format";
import { ArrowLeft, MapPin, CreditCard, Truck, Store } from "lucide-react";

function CheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug || "") as string;
  const { items, total, clearCart } = useCart();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    customer_notes: "",
    payment_method: "wave",
    delivery_method: "delivery",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setProcessing(true);
    setError("");

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API}/api/v1/shop/store/${slug}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur");
      clearCart();
      router.push(`/shop/${slug}/order/${data.order_id}`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la commande");
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Votre panier est vide</p>
          <Link href={`/shop/${slug}`} className="text-primary-600 font-medium">Retour à la boutique</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Commande</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Informations
            </h2>
            <div className="space-y-3">
              <input type="text" placeholder="Votre nom *" required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              <input type="tel" placeholder="Téléphone *" required value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              <input type="email" placeholder="Email (optionnel)" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              <textarea placeholder="Adresse de livraison *" required rows={2} value={form.customer_address} onChange={(e) => setForm({ ...form, customer_address: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              <textarea placeholder="Notes (optionnel)" rows={2} value={form.customer_notes} onChange={(e) => setForm({ ...form, customer_notes: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4" /> Livraison
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm({ ...form, delivery_method: "delivery" })} className={`rounded-lg border p-3 text-sm font-medium text-center transition-colors ${form.delivery_method === "delivery" ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                <Truck className="h-5 w-5 mx-auto mb-1" /> Livraison
              </button>
              <button type="button" onClick={() => setForm({ ...form, delivery_method: "pickup" })} className={`rounded-lg border p-3 text-sm font-medium text-center transition-colors ${form.delivery_method === "pickup" ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                <Store className="h-5 w-5 mx-auto mb-1" /> Retrait
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Paiement
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "wave", label: "Wave", icon: "📱" },
                { value: "orange_money", label: "Orange", icon: "🟠" },
                { value: "cash_on_delivery", label: "À la livraison", icon: "💵" },
              ].map((m) => (
                <button key={m.value} type="button" onClick={() => setForm({ ...form, payment_method: m.value })} className={`rounded-lg border p-3 text-sm font-medium text-center transition-colors ${form.payment_method === m.value ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <span className="text-lg">{m.icon}</span>
                  <p className="mt-1">{m.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Résumé</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} × {item.quantity}</span>
                  <span className="font-medium">{formatCFA(item.price_cfa * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary-600">{formatCFA(total)}</span>
              </div>
            </div>
          </div>

          <button type="submit" disabled={processing} className="w-full rounded-xl bg-primary-600 py-3.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50">
            {processing ? "Envoi en cours..." : `Confirmer la commande — ${formatCFA(total)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <CheckoutContent />;
}
