"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatCFA, getImageUrl } from "@/lib/format";
import { ShoppingCart, Search, Package, Plus, Minus, Trash2, Store, Phone, MessageSquare } from "lucide-react";

interface StoreInfo {
  tenant_id: string;
  store_name: string;
  store_description: string | null;
  banner_url: string | null;
  theme_color: string;
  delivery_fee_cfa: number;
  min_order_cfa: number;
  accepts_wave: boolean;
  accepts_orange_money: boolean;
  accepts_cash_on_delivery: boolean;
  phone: string | null;
  whatsapp: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price_cfa: number;
  stock_quantity: number;
  unit: string;
  image_url: string | null;
  category_name: string | null;
}

function StoreContent() {
  const params = useParams();
  const slug = (params?.slug || "") as string;
  const { items, addItem, itemCount } = useCart();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    Promise.all([
      fetch(`${API}/api/v1/shop/store/${slug}`).then((r) => r.ok ? r.json() : Promise.reject()),
      fetch(`${API}/api/v1/shop/store/${slug}/products`).then((r) => r.ok ? r.json() : Promise.reject()),
      fetch(`${API}/api/v1/shop/store/${slug}/categories`).then((r) => r.ok ? r.json() : []),
    ])
      .then(([s, p, c]) => { setStore(s); setProducts(p); setCategories(c); })
      .catch(() => setError("Boutique introuvable ou désactivée"))
      .finally(() => setLoading(false));
  }, [slug]);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || p.category_name === selectedCategory;
    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{error || "Boutique introuvable"}</h1>
          <p className="text-gray-500">Cette boutique n&apos;est pas disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{store.store_name}</h1>
            {store.store_description && (
              <p className="text-sm text-gray-500">{store.store_description}</p>
            )}
          </div>
          <Link
            href={`/shop/${slug}/cart`}
            className="relative flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-xs font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  !selectedCategory ? "bg-primary-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Tout
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedCategory === cat.name ? "bg-primary-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-500">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => {
              const inCart = items.find((i) => i.id === product.id);
              return (
                <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <Link href={`/shop/${slug}/product/${product.id}`}>
                    {product.image_url ? (
                      <img
                        src={getImageUrl(product.image_url)}
                        alt={product.name}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </Link>
                  <div className="p-3">
                    <Link href={`/shop/${slug}/product/${product.id}`}>
                      <h3 className="font-medium text-gray-900 truncate hover:text-primary-600">{product.name}</h3>
                    </Link>
                    {product.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                    )}
                    <p className="text-lg font-bold text-primary-600 mt-1">{formatCFA(product.price_cfa)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Stock: {product.stock_quantity}</p>
                    {inCart ? (
                      <div className="flex items-center justify-between mt-2 bg-primary-50 rounded-lg p-1.5">
                        <button onClick={() => addItem({ id: product.id, name: product.name, price_cfa: product.price_cfa, image_url: product.image_url, stock: product.stock_quantity })} className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center hover:bg-primary-200">
                          <Plus className="h-3 w-3 text-primary-700" />
                        </button>
                        <span className="text-sm font-bold text-primary-700">{inCart.quantity}</span>
                        <button onClick={() => { if (inCart.quantity <= 1) return; }} className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center hover:bg-primary-200">
                          <Minus className="h-3 w-3 text-primary-700" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addItem({ id: product.id, name: product.name, price_cfa: product.price_cfa, image_url: product.image_url, stock: product.stock_quantity })}
                        className="mt-2 w-full rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                      >
                        Ajouter
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{itemCount} article{itemCount > 1 ? "s" : ""}</p>
              <p className="text-lg font-bold">{formatCFA(items.reduce((s, i) => s + i.price_cfa * i.quantity, 0))}</p>
            </div>
            <Link
              href={`/shop/${slug}/cart`}
              className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Voir le panier
            </Link>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-gray-200 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          {store.phone && (
            <a href={`tel:${store.phone}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mr-4">
              <Phone className="h-4 w-4" /> {store.phone}
            </a>
          )}
          {store.whatsapp && (
            <a href={`https://wa.me/${store.whatsapp}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-600">
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </a>
          )}
          <p className="text-xs text-gray-400 mt-3">Naatal ERP Cloud — Boutique en ligne</p>
        </div>
      </footer>
    </div>
  );
}

export default function StorePage() {
  return <StoreContent />;
}
