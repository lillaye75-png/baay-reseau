"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatCFA } from "@/lib/format";
import api, { DashboardSummary, WeeklyDay, Product } from "@/lib/api";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Wallet,
  CreditCard,
  BarChart3,
  ArrowUpRight,
  ShoppingCart,
  Users,
  PackageOpen,
  Send,
  Bell,
} from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#ef4444"];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [weekly, setWeekly] = useState<WeeklyDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingAlert, setSendingAlert] = useState<string | null>(null);

  const sendStockAlert = async () => {
    setSendingAlert("stock");
    try {
      const res = await api.post("/dashboard/alerts/stock");
      if (res.data.alerts_sent?.length > 0) {
        showToast("Alerte stock envoyée par WhatsApp !");
      } else {
        showToast(`${res.data.low_stock_count} produit(s) en stock bas`, "warning");
      }
    } catch { showToast("Erreur", "error"); }
    setSendingAlert(null);
  };

  const sendDebtAlert = async () => {
    setSendingAlert("debt");
    try {
      const res = await api.post("/dashboard/alerts/debt");
      if (res.data.alerts_sent?.length > 0) {
        showToast("Rappel crédit envoyé par WhatsApp !");
      } else {
        showToast(`${res.data.debtors_count} client(s) endetté(s)`, "warning");
      }
    } catch { showToast("Erreur", "error"); }
    setSendingAlert(null);
  };

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/summary"),
      api.get("/sales/stats/weekly"),
    ])
      .then(([s, w]) => {
        setSummary(s.data);
        setWeekly(w.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="text-sm text-gray-500">Chargement du tableau de bord...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pieData = [
    { name: "Espèces", value: summary?.revenue.cash_cfa || 0 },
    { name: "Wave", value: summary?.revenue.wave_cfa || 0 },
    { name: "Crédit", value: summary?.revenue.credit_cfa || 0 },
  ].filter((d) => d.value > 0);

  const weeklyTotal = weekly.reduce((s, d) => s + d.revenue, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500">Vue d&apos;ensemble de votre boutique</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/25">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ventes du jour</p>
                <p className="text-2xl font-bold">{summary?.revenue.total_sales || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/25">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenu du jour</p>
                <p className="text-2xl font-bold">{formatCFA(summary?.revenue.total_revenue_cfa || 0)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/25">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Produits</p>
                <p className="text-2xl font-bold">{summary?.inventory.total_products || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/25">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Stock bas</p>
                <p className="text-2xl font-bold">{summary?.inventory.low_stock_count || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Ventes de la semaine</h2>
                <span className="text-sm text-gray-500">Total: {formatCFA(weeklyTotal)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [formatCFA(value), "Revenu"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                    />
                    <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Répartition</h2>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCFA(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BarChart3 className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Aucune vente aujourd&apos;hui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Alertes stock</h2>
                {summary?.inventory.low_stock_count ? (
                  <button
                    onClick={sendStockAlert}
                    disabled={sendingAlert === "stock"}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    {sendingAlert === "stock" ? "Envoi..." : "Alerte WhatsApp"}
                  </button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {summary?.inventory.low_stock_products.length ? (
                <div className="space-y-2">
                  {summary.inventory.low_stock_products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                      <div className="flex items-center gap-2">
                        <PackageOpen className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                      <span className="text-sm font-bold text-red-600">
                        {p.stock} restant{p.stock > 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Tous les stocks sont bons!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Crédits</h2>
                {(summary?.credit?.total_debtors || 0) > 0 ? (
                  <button
                    onClick={sendDebtAlert}
                    disabled={sendingAlert === "debt"}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    {sendingAlert === "debt" ? "Envoi..." : "Rappel WhatsApp"}
                  </button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Clients endettés</span>
                <span className="font-bold">{summary?.credit?.total_debtors || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Total dettes</span>
                <span className="font-bold text-red-600">{formatCFA(summary?.credit?.total_outstanding_cfa || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Valeur stock</span>
                <span className="font-bold">{formatCFA(summary?.inventory.total_stock_value_cfa || 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Résumé rapide</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: ShoppingCart, label: "Ventes aujourd'hui", value: summary?.revenue.total_sales || 0, color: "text-green-600" },
                { icon: Wallet, label: "Revenu", value: formatCFA(summary?.revenue.total_revenue_cfa || 0), color: "text-primary-600" },
                { icon: Package, label: "Produits", value: summary?.inventory.total_products || 0, color: "text-blue-600" },
                { icon: AlertTriangle, label: "Alertes stock", value: summary?.inventory.low_stock_count || 0, color: "text-red-600" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    <span className="text-sm text-gray-500">{item.label}</span>
                  </div>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
