"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatCFA, formatDateTime, getPaymentMethodLabel, getPaymentMethodColor } from "@/lib/format";
import api, { Sale } from "@/lib/api";
import { Search, Receipt, Calendar, X, Package, Download, Eye } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { exportSales } from "@/lib/export";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    api.get("/sales/")
      .then((res) => setSales(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = sales.filter((s) =>
    s.payment_method.toLowerCase().includes(search.toLowerCase()) ||
    (s.id && s.id.toLowerCase().includes(search.toLowerCase()))
  );

  const todayTotal = sales
    .filter((s) => {
      const d = new Date(s.created_at);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    })
    .reduce((sum, s) => sum + s.total_cfa, 0);

  const todayCount = sales.filter((s) => {
    const d = new Date(s.created_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historique des ventes</h1>
            <p className="text-sm text-gray-500">{sales.length} ventes au total</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => exportSales(sales)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Exporter
            </button>
            <Card className="!p-0">
              <CardContent className="flex items-center gap-3 px-4 py-2">
                <Calendar className="h-4 w-4 text-primary-600" />
                <div>
                  <p className="text-xs text-gray-500">Aujourd&apos;hui</p>
                  <p className="text-sm font-bold">{formatCFA(todayTotal)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="!p-0">
              <CardContent className="flex items-center gap-3 px-4 py-2">
                <Receipt className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Transactions</p>
                  <p className="text-sm font-bold">{todayCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {selectedSale && (
          <Card className="border-primary-200 bg-primary-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-primary-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Détails de la vente</h3>
                    <p className="text-xs text-gray-500 font-mono">{selectedSale.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedSale(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium">{formatDateTime(selectedSale.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Paiement</p>
                  <Badge variant={getPaymentMethodColor(selectedSale.payment_method) as any}>
                    {getPaymentMethodLabel(selectedSale.payment_method)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-bold">{formatCFA(selectedSale.total_cfa)}</p>
                </div>
              </div>

              <div className="rounded-lg bg-white border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produit</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qté</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Prix unitaire</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedSale.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Package className="h-3 w-3 text-gray-400" />
                            {item.product_id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCFA(item.unit_price_cfa)}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium">{formatCFA(item.total_cfa)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par mode de paiement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <Card>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune vente enregistrée</p>
              <p className="text-sm text-gray-400">Commencez par une vente au POS</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Articles</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Paiement</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedSale(sale)}>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(sale.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {sale.items.length} article{sale.items.length > 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-bold">
                        {formatCFA(sale.total_cfa)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={getPaymentMethodColor(sale.payment_method) as any}>
                          {getPaymentMethodLabel(sale.payment_method)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {sale.is_credit ? (
                          <Badge variant="warning">Crédit</Badge>
                        ) : (
                          <Badge variant="success">Payé</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link href={`/invoices/${sale.id}`} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">
                          <Eye className="h-3 w-3" />
                          Voir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
