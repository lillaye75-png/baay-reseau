"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatCFA } from "@/lib/format";
import api from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  Wallet,
  Package,
  Download,
  Calendar,
  CreditCard,
  ShoppingCart,
  Crown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { showToast } from "@/components/ui/Toast";

interface ReportData {
  period: string;
  label: string;
  sales_count: number;
  total_revenue_cfa: number;
  cash_cfa: number;
  wave_cfa: number;
  orange_money_cfa: number;
  credit_cfa: number;
  inventory_value_cfa: number;
  total_products: number;
}

interface TopProduct {
  product_id: string;
  product_name: string;
  total_qty: number;
  total_revenue: number;
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [period, setPeriod] = useState("daily");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/reports/sales?period=${period}`),
      api.get("/reports/top-products"),
    ])
      .then(([r, tp]) => {
        setReport(r.data);
        setTopProducts(tp.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const exportCSV = () => {
    if (!report) return;
    const csv = [
      ["Rapport", report.label],
      ["Ventes", report.sales_count],
      ["Revenu total", report.total_revenue_cfa],
      ["Espèces", report.cash_cfa],
      ["Wave", report.wave_cfa],
      ["Orange Money", report.orange_money_cfa],
      ["Crédit", report.credit_cfa],
      ["Valeur stock", report.inventory_value_cfa],
      ["Produits", report.total_products],
      [""],
      ["Top Produits", "Quantité", "Revenu"],
      ...topProducts.map((p) => [p.product_name, p.total_qty, p.total_revenue]),
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Rapport exporté !");
  };

  const periods = [
    { value: "daily", label: "Aujourd'hui", icon: Calendar },
    { value: "weekly", label: "Semaine", icon: Calendar },
    { value: "monthly", label: "Mois", icon: Calendar },
    { value: "yearly", label: "Année", icon: Calendar },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
            <p className="text-sm text-gray-500">Analyse des ventes et du stock</p>
          </div>
          <Button variant="secondary" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>

        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                period === p.value
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <p.icon className="h-4 w-4" />
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : report ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-green-600">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ventes</p>
                    <p className="text-2xl font-bold">{report.sales_count}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Revenu</p>
                    <p className="text-2xl font-bold">{formatCFA(report.total_revenue_cfa)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Crédit</p>
                    <p className="text-2xl font-bold">{formatCFA(report.credit_cfa)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valeur stock</p>
                    <p className="text-2xl font-bold">{formatCFA(report.inventory_value_cfa)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Répartition paiements</h2>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "Espèces", value: report.cash_cfa },
                          { name: "Wave", value: report.wave_cfa },
                          { name: "Orange", value: report.orange_money_cfa },
                          { name: "Crédit", value: report.credit_cfa },
                        ]}
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => formatCFA(v)} />
                        <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <h2 className="text-lg font-semibold">Top Produits</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  {topProducts.length > 0 ? (
                    <div className="space-y-2">
                      {topProducts.map((p, i) => (
                        <div key={p.product_id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                              i === 0 ? "bg-yellow-100 text-yellow-700" :
                              i === 1 ? "bg-gray-200 text-gray-600" :
                              i === 2 ? "bg-orange-100 text-orange-700" :
                              "bg-gray-100 text-gray-500"
                            }`}>
                              {i + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium">{p.product_name}</p>
                              <p className="text-xs text-gray-500">{p.total_qty} vendus</p>
                            </div>
                          </div>
                          <span className="font-bold text-sm">{formatCFA(p.total_revenue)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Aucune donnée</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
