"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCFA, formatDateTime, getPaymentMethodColor, getPaymentMethodLabel } from "@/lib/format";
import api, { Sale } from "@/lib/api";
import { Search, FileText, Eye, Download } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

export default function InvoicesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/sales/")
      .then((res) => setSales(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase();
    return s.id.toLowerCase().includes(q) ||
      s.payment_method.toLowerCase().includes(q) ||
      (s as any).customer?.name?.toLowerCase().includes(q);
  });

  const todayTotal = sales
    .filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.total_cfa, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
            <p className="text-sm text-gray-500">{sales.length} factures au total</p>
          </div>
          <Card className="!p-0">
            <CardContent className="flex items-center gap-3 px-4 py-2">
              <FileText className="h-4 w-4 text-primary-600" />
              <div>
                <p className="text-xs text-gray-500">Total aujourd&apos;hui</p>
                <p className="text-sm font-bold">{formatCFA(todayTotal)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par ID, client ou paiement..."
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
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune facture</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Facture</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Paiement</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Voir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        #{sale.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(sale.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(sale as any).customer?.name || "Client de passage"}
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
                        <Link
                          href={`/invoices/${sale.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                        >
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
