"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatCFA, getImageUrl } from "@/lib/format";
import { ArrowLeft, ShoppingCart, Plus, Minus, Package } from "lucide-react";

interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
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
  images: ProductImage[];
  category_name: string | null;
}

function ProductContent() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug || "") as string;
  const productId = (params?.id || "") as string;
  const { items, addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetch(`${API}/api/v1/shop/store/${slug}/product/${productId}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setProduct)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Produit introuvable</p>
      </div>
    );
  }

  const allImages = product.images?.length ? product.images : (product.image_url ? [{ id: "1", url: product.image_url, alt_text: product.name, is_primary: true }] : []);
  const inCart = items.find((i) => i.id === product.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold truncate">{product.name}</h1>
          <Link href={`/shop/${slug}/cart`} className="ml-auto relative p-2 rounded-lg hover:bg-gray-100">
            <ShoppingCart className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {allImages.length > 0 ? (
          <div className="space-y-3">
            <div className="w-full h-64 sm:h-80 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
              <img
                src={getImageUrl(allImages[selectedImage]?.url || allImages[0].url)}
                alt={allImages[selectedImage]?.alt_text || product.name}
                className="w-full h-full object-contain"
              />
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? "border-primary-500" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img src={getImageUrl(img.url)} alt={img.alt_text || ""} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-64 sm:h-80 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Package className="h-20 w-20 text-gray-300" />
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            {product.category_name && (
              <span className="text-xs text-primary-600 font-medium">{product.category_name}</span>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{product.name}</h1>
            <p className="text-3xl font-bold text-primary-600 mt-2">{formatCFA(product.price_cfa)}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Stock: {product.stock_quantity} {product.unit}</span>
            {product.sku && <span className="font-mono">SKU: {product.sku}</span>}
          </div>

          {product.description && (
            <div className="rounded-xl bg-white border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-3">Ajouter au panier</h3>
            {inCart ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-2">
                  <button onClick={() => addItem({ id: product.id, name: product.name, price_cfa: product.price_cfa, image_url: product.image_url, stock: product.stock_quantity })} className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Plus className="h-4 w-4" />
                  </button>
                  <span className="font-bold text-lg w-8 text-center">{inCart.quantity}</span>
                  <Minus className="h-4 w-4 text-gray-400" />
                </div>
                <Link
                  href={`/shop/${slug}/cart`}
                  className="flex-1 rounded-xl bg-primary-600 py-3 text-center text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                >
                  Voir le panier
                </Link>
              </div>
            ) : (
              <button
                onClick={() => addItem({ id: product.id, name: product.name, price_cfa: product.price_cfa, image_url: product.image_url, stock: product.stock_quantity })}
                className="w-full rounded-xl bg-primary-600 py-3 text-sm font-medium text-white hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Ajouter au panier — {formatCFA(product.price_cfa)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductPage() {
  return <ProductContent />;
}
