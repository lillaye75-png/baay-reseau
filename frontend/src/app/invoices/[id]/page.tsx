"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import A4Invoice from "@/components/receipt/A4Invoice";
import Button from "@/components/ui/Button";
import { formatCFA } from "@/lib/format";
import api from "@/lib/api";
import { ArrowLeft, Edit, Trash2, Printer } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

interface SaleData {
  id: string;
  total_cfa: number;
  payment_method: string;
  is_credit: boolean;
  created_at: string;
  customer_id: string | null;
  customer: { id: string; name: string; phone: string | null } | null;
  items: { product_id: string; product_name: string; quantity: number; unit_price_cfa: number; total_cfa: number }[];
}

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const saleId = (params?.id || "") as string;
  const [sale, setSale] = useState<SaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({ items: [] as any[], payment_method: "cash", customer_id: null as string | null, is_credit: false });

  useEffect(() => {
    api.get(`/sales/${saleId}`)
      .then((res) => {
        setSale(res.data);
        setEditForm({
          items: res.data.items.map((i: any) => ({ product_id: i.product_id, quantity: i.quantity, unit_price_cfa: i.unit_price_cfa })),
          payment_method: res.data.payment_method,
          customer_id: res.data.customer_id,
          is_credit: res.data.is_credit,
        });
      })
      .catch(() => showToast("Facture introuvable", "error"))
      .finally(() => setLoading(false));
    api.get("/products/").then((res) => setProducts(res.data)).catch(() => {});
  }, [saleId]);

  const handleDelete = async () => {
    if (!confirm("Annuler cette facture ? Le stock sera restauré.")) return;
    try {
      await api.delete(`/sales/${saleId}`);
      showToast("Facture annulée, stock restauré");
      router.push("/sales");
    } catch { showToast("Erreur", "error"); }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await api.put(`/sales/${saleId}`, editForm);
      setSale(res.data);
      setEditMode(false);
      showToast("Facture modifiée");
    } catch { showToast("Erreur", "error"); }
  };

  if (loading) {
    return <DashboardLayout><div className="flex justify-center py-16"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div></DashboardLayout>;
  }

  if (!sale) {
    return <DashboardLayout><div className="text-center py-16"><p className="text-gray-500">Facture introuvable</p></div></DashboardLayout>;
  }

  if (editMode) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setEditMode(false)} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-2xl font-bold text-gray-900">Modifier la facture</h1>
          </div>

          <Card>
            <CardContent className="space-y-4">
              {editForm.items.map((item: any, idx: number) => {
                const product = products.find((p) => p.id === item.product_id);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <select
                      value={item.product_id}
                      onChange={(e) => {
                        const p = products.find((p) => p.id === e.target.value);
                        const newItems = [...editForm.items];
                        newItems[idx] = { ...newItems[idx], product_id: e.target.value, unit_price_cfa: p?.price_cfa || 0 };
                        setEditForm({ ...editForm, items: newItems });
                      }}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} — {formatCFA(p.price_cfa)}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...editForm.items];
                        newItems[idx] = { ...newItems[idx], quantity: parseInt(e.target.value) || 1 };
                        setEditForm({ ...editForm, items: newItems });
                      }}
                      className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center"
                      min={1}
                    />
                    <button onClick={() => {
                      const newItems = editForm.items.filter((_: any, i: number) => i !== idx);
                      setEditForm({ ...editForm, items: newItems });
                    }} className="text-red-500 hover:text-red-700">✕</button>
                  </div>
                );
              })}
              <Button variant="secondary" onClick={() => setEditForm({ ...editForm, items: [...editForm.items, { product_id: products[0]?.id || "", quantity: 1, unit_price_cfa: products[0]?.price_cfa || 0 }] })}>
                + Ajouter un article
              </Button>
              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Total</span>
                <span>{formatCFA(editForm.items.reduce((s: number, i: any) => s + i.quantity * i.unit_price_cfa, 0))}</span>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setEditMode(false)}>Annuler</Button>
                <Button onClick={handleSaveEdit}>Enregistrer</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-4 print:hidden">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900">Facture #{saleId.slice(0, 8).toUpperCase()}</h1>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
              <Edit className="h-4 w-4 mr-1" /> Modifier
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Annuler
            </Button>
          </div>
        </div>

        <A4Invoice
          saleId={sale.id}
          items={sale.items}
          total={sale.total_cfa}
          paymentMethod={sale.payment_method}
          customerName={sale.customer?.name}
          customerPhone={sale.customer?.phone || undefined}
          createdAt={sale.created_at}
          onDelete={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
}

function Card({ children, className = "" }: any) {
  return <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function CardContent({ children, className = "" }: any) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}
