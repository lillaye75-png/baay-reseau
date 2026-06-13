"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatCFA } from "@/lib/format";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

function CartContent() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug || "") as string;
  const { items, removeItem, updateQuantity, total } = useCart();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Mon panier</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-500 mb-4">Votre panier est vide</p>
            <Link href={`/shop/${slug}`} className="text-primary-600 font-medium hover:text-primary-700">
              Retour à la boutique
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                {item.image_url ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${item.image_url}`}
                    alt={item.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-sm text-primary-600 font-bold">{formatCFA(item.price_cfa)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="font-bold">{formatCFA(item.price_cfa * item.quantity)}</p>
                  <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 mt-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-white rounded-xl border border-gray-200 p-4 mt-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-600">{formatCFA(total)}</span>
              </div>
            </div>

            <Link
              href={`/shop/${slug}/checkout`}
              className="block w-full rounded-xl bg-primary-600 py-3.5 text-center text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              Passer la commande
            </Link>

            <Link href={`/shop/${slug}`} className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
              Continuer les achats
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CartPage() {
  return <CartContent />;
}
