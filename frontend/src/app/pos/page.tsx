"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatCFA, getImageUrl } from "@/lib/format";
import api, { Product, Customer } from "@/lib/api";
import { ShoppingCart, Trash2, Plus, Minus, Search, Package, Receipt, X, ScanBarcode, Camera } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import SaleReceipt from "@/components/receipt/SaleReceipt";
import PaymentLinkModal from "@/components/pos/PaymentLinkModal";
import BarcodeScanner from "@/components/pos/BarcodeScanner";
import { queueSaleOffline, isOnline, syncPendingSales } from "@/lib/offline-sync";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showPaymentLink, setShowPaymentLink] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [lastSale, setLastSale] = useState<Record<string, unknown> | null>(null);
  const [mobileView, setMobileView] = useState<"products" | "cart">("products");

  useEffect(() => {
    api.get("/products/").then((res) => setProducts(res.data));
    api.get("/customers/").then((res) => setCustomers(res.data));
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const handleBarcodeScan = async (code: string) => {
    if (!code.trim()) return;
    try {
      const res = await api.get(`/products/barcode/${code.trim()}`);
      const product = res.data;
      if (product.stock_quantity <= 0) {
        showToast("Stock épuisé", "error");
        return;
      }
      addToCart(product);
      showToast(`${product.name} ajouté`);
    } catch {
      showToast("Produit non trouvé", "error");
    }
    setBarcodeInput("");
  };

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      showToast("Stock épuisé pour ce produit", "error");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          showToast("Stock insuffisant", "error");
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const total = cart.reduce((sum, i) => sum + i.product.price_cfa * i.quantity, 0);
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);

    const saleData = {
      customer_id: selectedCustomer?.id || null,
      items: cart.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
        unit_price_cfa: i.product.price_cfa,
      })),
      payment_method: paymentMethod,
      is_credit: paymentMethod === "credit",
    };

    if (!isOnline()) {
      const local_id = await queueSaleOffline(saleData);
      showToast("Vente mise en file d'attente (hors-ligne)");
      setLastSale({
        id: local_id,
        items: cart.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          unit_price_cfa: i.product.price_cfa,
          total_cfa: i.product.price_cfa * i.quantity,
        })),
        total,
        paymentMethod,
        customerName: selectedCustomer?.name,
        createdAt: new Date().toISOString(),
        offline: true,
      });
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod("cash");
      setProcessing(false);
      return;
    }

    try {
      const res = await api.post("/sales/", saleData);
      showToast(`Vente de ${formatCFA(total)} enregistrée !`);
      setLastSale({
        id: res.data.id,
        items: cart.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          unit_price_cfa: i.product.price_cfa,
          total_cfa: i.product.price_cfa * i.quantity,
        })),
        total,
        paymentMethod,
        customerName: selectedCustomer?.name,
        createdAt: res.data.created_at,
      });
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod("cash");
      api.get("/products/").then((res) => setProducts(res.data));

      const pending = await syncPendingSales();
      if (pending.synced > 0) {
        showToast(`${pending.synced} vente(s) hors-ligne synchronisée(s) !`);
      }
    } catch (err) {
      const local_id = await queueSaleOffline(saleData);
      showToast("Vente mise en file d'attente (erreur réseau)");
      setLastSale({
        id: local_id,
        items: cart.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          unit_price_cfa: i.product.price_cfa,
          total_cfa: i.product.price_cfa * i.quantity,
        })),
        total,
        paymentMethod,
        customerName: selectedCustomer?.name,
        createdAt: new Date().toISOString(),
        offline: true,
      });
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod("cash");
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { value: "cash", label: "Espèces", icon: "💵" },
    { value: "wave", label: "Wave", icon: "📱" },
    { value: "orange_money", label: "Orange", icon: "🟠" },
    { value: "credit", label: "Crédit", icon: "📝" },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-3rem)] gap-4 lg:gap-6">
        <div className="flex lg:hidden items-center gap-2 mb-2">
          <button
            onClick={() => setMobileView("products")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
              mobileView === "products"
                ? "bg-primary-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Produits ({filteredProducts.length})
          </button>
          <button
            onClick={() => setMobileView("cart")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all relative ${
              mobileView === "cart"
                ? "bg-primary-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Panier ({totalItems})
            {totalItems > 0 && mobileView === "products" && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto ${mobileView === "cart" ? "hidden lg:block" : ""}`}>
          <div className="mb-4 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit ou SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Scanner un code-barres..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleBarcodeScan(barcodeInput);
                  }}
                  className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 pl-10 pr-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:border-primary-400 transition-colors"
              >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Caméra</span>
              </button>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500">
                {products.length === 0 ? "Aucun produit" : "Aucun résultat"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {products.length === 0
                  ? "Ajoutez des produits depuis la page Produits"
                  : "Essayez un autre terme de recherche"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                const outOfStock = product.stock_quantity <= 0;
                return (
                  <Card
                    key={product.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      outOfStock
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-primary-500 hover:shadow-md hover:scale-[1.02]"
                    } ${inCart ? "border-primary-500 ring-2 ring-primary-500/20" : ""}`}
                    onClick={() => !outOfStock && addToCart(product)}
                  >
                    <CardContent className="p-4 text-center">
                      {product.image_url && (
                        <div className="mb-2 flex justify-center">
                          <img
                            src={getImageUrl(product.image_url)}
                            alt={product.name}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        </div>
                      )}
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-lg font-bold text-primary-600 mt-1">
                        {formatCFA(product.price_cfa)}
                      </p>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <span className={`text-xs ${outOfStock ? "text-red-500 font-bold" : product.stock_quantity <= product.low_stock_threshold ? "text-orange-500" : "text-gray-500"}`}>
                          Stock: {product.stock_quantity}
                        </span>
                        {inCart && (
                          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700">
                            ×{inCart.quantity}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className={`w-full lg:w-96 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden ${mobileView === "products" ? "hidden lg:flex" : "flex"}`}>
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <ShoppingCart className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Panier</h2>
              </div>
              {totalItems > 0 && (
                <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white">
                  {totalItems} article{totalItems > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="h-12 w-12 text-gray-200 mb-3" />
                <p className="text-sm text-gray-500">Panier vide</p>
                <p className="text-xs text-gray-400 mt-1">Cliquez sur un produit pour l&apos;ajouter</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{formatCFA(item.product.price_cfa)} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center hover:bg-primary-200 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors ml-1"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-200 p-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Client</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-gray-50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                value={selectedCustomer?.id || ""}
                onChange={(e) => {
                  const c = customers.find((c) => c.id === e.target.value);
                  setSelectedCustomer(c || null);
                }}
              >
                <option value="">Client de passage</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.nickname ? `(${c.nickname})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Paiement</label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                      paymentMethod === m.value
                        ? "border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-500/20"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="mr-1">{m.icon}</span> {m.label}
                  </button>
                ))}
              </div>
              {(paymentMethod === "wave" || paymentMethod === "orange_money") && cart.length > 0 && (
                <button
                  onClick={() => setShowPaymentLink(true)}
                  className="mt-2 w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  Générer un lien de paiement {paymentMethod === "wave" ? "Wave" : "Orange Money"}
                </button>
              )}
            </div>

            <div className="rounded-xl bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Sous-total ({totalItems} articles)</span>
                <span className="font-medium">{formatCFA(total)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold mt-1 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-primary-600">{formatCFA(total)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing}
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enregistrement...
                </span>
              ) : (
                `Enregistrer — ${formatCFA(total)}`
              )}
            </Button>
          </div>
        </div>
      </div>

      {lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold">Vente enregistrée !</h2>
              </div>
              <button onClick={() => setLastSale(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <SaleReceipt
                saleId={lastSale.id as string}
                items={lastSale.items as any}
                total={lastSale.total as number}
                paymentMethod={lastSale.paymentMethod as string}
                customerName={lastSale.customerName as string}
                createdAt={lastSale.createdAt as string}
              />
            </div>
            <div className="px-6 pb-4 print:hidden">
              <Button className="w-full" onClick={() => setLastSale(null)}>
                Nouvelle vente
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPaymentLink && (
        <PaymentLinkModal
          amount={total}
          method={paymentMethod as "wave" | "orange_money"}
          customerPhone={selectedCustomer?.phone || undefined}
          orderId={`sale-${Date.now()}`}
          onClose={() => setShowPaymentLink(false)}
        />
      )}

      {showScanner && (
        <BarcodeScanner
          onScan={(code) => {
            setShowScanner(false);
            handleBarcodeScan(code);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </DashboardLayout>
  );
}
