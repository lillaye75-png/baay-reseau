"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatCFA } from "@/lib/format";
import api, { Customer } from "@/lib/api";
import { Zap, Check, X, Receipt } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import SaleReceipt from "@/components/receipt/SaleReceipt";

export default function QuickSalePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.get("/customers/").then((res) => setCustomers(res.data)).catch(() => {});
  }, []);

  const total = quantity * (parseInt(unitPrice) || 0);

  const handleCheckout = async () => {
    if (!productName.trim() || !unitPrice) {
      showToast("Nom du produit et prix requis", "error");
      return;
    }
    setProcessing(true);
    try {
      const res = await api.post("/sales/quick", {
        customer_id: selectedCustomer?.id || null,
        product_name: productName.trim(),
        quantity,
        unit_price_cfa: parseInt(unitPrice),
        payment_method: paymentMethod,
        is_credit: paymentMethod === "credit",
      });
      showToast(`Vente rapide de ${formatCFA(total)} enregistrée !`);
      setLastSale({
        id: res.data.id,
        items: [{ name: productName, quantity, unit_price_cfa: parseInt(unitPrice), total_cfa: total }],
        total,
        paymentMethod,
        customerName: selectedCustomer?.name,
        createdAt: res.data.created_at,
      });
      setProductName("");
      setQuantity(1);
      setUnitPrice("");
      setPaymentMethod("cash");
      setSelectedCustomer(null);
    } catch (err) {
      showToast("Erreur lors de la vente", "error");
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
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vente Rapide</h1>
            <p className="text-sm text-gray-500">Sans sélectionner de produit</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <Input
              label="Nom du produit / Description"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: Chargeur, Écran cassé, Service..."
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quantité"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <Input
                label="Prix unitaire (CFA)"
                type="number"
                min={0}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0"
              />
            </div>

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
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-600">{formatCFA(total)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={processing || !productName.trim() || !unitPrice}
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
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Confirmer — {formatCFA(total)}
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
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
    </DashboardLayout>
  );
}
