"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Search, Package } from "lucide-react";

export default function TrackOrderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug || "") as string;
  const [orderId, setOrderId] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      router.push(`/shop/${slug}/order/${orderId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Suivre ma commande</h1>
          <p className="text-sm text-gray-500 mt-2">
            Entrez votre numéro de commande pour suivre sa livraison
          </p>
        </div>

        <form onSubmit={handleTrack} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Numéro de commande (ex: a1b2c3d4)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!orderId.trim()}
            className="w-full rounded-xl bg-primary-600 py-3 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            Suivre la commande
          </button>
        </form>

        <button
          onClick={() => router.back()}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
        >
          Retour à la boutique
        </button>
      </div>
    </div>
  );
}
