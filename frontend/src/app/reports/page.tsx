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
  TrendingDown,
  Wallet,
  Package,
  Download,
  Calendar,
  CreditCard,
  Crown,
  FileText,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  total_expenses_cfa: number;
  profit_cfa: number;
}

interface TopProduct {
  product_id: string;
  product_name: string;
  total_qty: number;
  total_revenue: number;
}

interface TrendsData {
  daily_data: { date: string; sales_count: number; revenue: number }[];
  summary: {
    total_revenue: number;
    total_sales: number;
    avg_daily_revenue: number;
    avg_daily_sales: number;
    revenue_trend_pct: number;
  };
}

interface ComparisonData {
  period1: { sales_count: number; revenue: number; expenses: number; profit: number };
  period2: { sales_count: number; revenue: number; expenses: number; profit: number };
  changes: { sales_count: number; revenue: number; expenses: number; profit: number };
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [period, setPeriod] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "compare">("overview");

  const [compP1Start, setCompP1Start] = useState("");
  const [compP1End, setCompP1End] = useState("");
  const [compP2Start, setCompP2Start] = useState("");
  const [compP2End, setCompP2End] = useState("");

  const fetchReport = (p?: string, start?: string, end?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (start && end) {
      params.set("start_date", start);
      params.set("end_date", end);
    } else {
      params.set("period", p || period);
    }
    Promise.all([
      api.get(`/reports/sales?${params.toString()}`),
      api.get(`/reports/top-products?${params.toString()}`),
      api.get("/reports/trends?days=30"),
    ])
      .then(([r, tp, tr]) => {
        setReport(r.data);
        setTopProducts(tp.data);
        setTrends(tr.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isCustom) fetchReport(period);
  }, [period, isCustom]);

  const handleCustomDate = () => {
    if (!customStart || !customEnd) {
      showToast("Sélectionnez les deux dates", "error");
      return;
    }
    setIsCustom(true);
    fetchReport(undefined, customStart, customEnd);
  };

  const handlePreset = (p: string) => {
    setIsCustom(false);
    setPeriod(p);
  };

  const handleCompare = async () => {
    if (!compP1Start || !compP1End || !compP2Start || !compP2End) {
      showToast("Remplissez les 4 dates", "error");
      return;
    }
    try {
      const res = await api.get(
        `/reports/compare?period1_start=${compP1Start}&period1_end=${compP1End}&period2_start=${compP2Start}&period2_end=${compP2End}`
      );
      setComparison(res.data);
    } catch {
      showToast("Erreur lors de la comparaison", "error");
    }
  };

  const exportCSV = () => {
    if (!report) return;
    const csv = [
      ["Rapport", report.label],
      ["Ventes", report.sales_count],
      ["Revenu total", report.total_revenue_cfa],
      ["Dépenses", report.total_expenses_cfa],
      ["Bénéfice net", report.profit_cfa],
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
    a.download = `rapport-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exporté !");
  };

  const exportPDF = () => {
    if (!report) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Rapport ${report.label}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        h1 { font-size: 22px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0; }
        .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
        .card h3 { margin: 0 0 6px; font-size: 12px; color: #666; text-transform: uppercase; }
        .card p { margin: 0; font-size: 20px; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
        @media print { body { padding: 10px; } }
      </style></head><body>
      <h1>Rapport - ${report.label}</h1>
      <p style="color:#666">Généré le ${new Date().toLocaleDateString("fr-SN")}</p>
      <div class="grid">
        <div class="card"><h3>Ventes</h3><p>${report.sales_count}</p></div>
        <div class="card"><h3>Revenu</h3><p>${formatCFA(report.total_revenue_cfa)}</p></div>
        <div class="card"><h3>Dépenses</h3><p>${formatCFA(report.total_expenses_cfa)}</p></div>
        <div class="card"><h3>Bénéfice net</h3><p>${formatCFA(report.profit_cfa)}</p></div>
      </div>
      ${topProducts.length > 0 ? `
        <h2 style="font-size:16px;margin-top:20px">Top Produits</h2>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f3f4f6"><th style="padding:8px;text-align:left">Produit</th><th style="padding:8px;text-align:right">Qté</th><th style="padding:8px;text-align:right">Revenu</th></tr></thead>
          <tbody>${topProducts.map(p => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${p.product_name}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #eee">${p.total_qty}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #eee;font-weight:bold">${formatCFA(p.total_revenue)}</td></tr>`).join("")}</tbody>
        </table>
      ` : ""}
      <div class="footer">Naatal ERP — Rapport automatique</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const periods = [
    { value: "daily", label: "Aujourd'hui", icon: Calendar },
    { value: "weekly", label: "Semaine", icon: Calendar },
    { value: "monthly", label: "Mois", icon: Calendar },
    { value: "yearly", label: "Année", icon: Calendar },
  ];

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
            <p className="text-sm text-gray-500">Analyse des ventes, dépenses et bénéfices</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="secondary" onClick={exportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: "overview", label: "Vue d'ensemble" },
            { key: "trends", label: "Tendances" },
            { key: "compare", label: "Comparer" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePreset(p.value)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    !isCustom && period === p.value
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <p.icon className="h-4 w-4" />
                  {p.label}
                </button>
              ))}
              <div className="flex items-center gap-2 ml-2 border-l pl-2">
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <span className="text-gray-400">à</span>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <Button size="sm" onClick={handleCustomDate}>Personnaliser</Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
              </div>
            ) : report ? (
              <div id="report-content">
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
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-red-600">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Dépenses</p>
                        <p className="text-2xl font-bold">{formatCFA(report.total_expenses_cfa)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Bénéfice net</p>
                        <p className={`text-2xl font-bold ${report.profit_cfa >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {formatCFA(report.profit_cfa)}
                        </p>
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
              </div>
            ) : null}
          </>
        )}

        {activeTab === "trends" && trends && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-500">Revenu total (30j)</p>
                  <p className="text-2xl font-bold">{formatCFA(trends.summary.total_revenue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-500">Ventes totales (30j)</p>
                  <p className="text-2xl font-bold">{trends.summary.total_sales}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-500">Moy. journalière</p>
                  <p className="text-2xl font-bold">{formatCFA(trends.summary.avg_daily_revenue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-500">Tendance 7j</p>
                  <div className="flex items-center justify-center gap-2">
                    <TrendIcon value={trends.summary.revenue_trend_pct} />
                    <p className={`text-2xl font-bold ${trends.summary.revenue_trend_pct >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {trends.summary.revenue_trend_pct > 0 ? "+" : ""}{trends.summary.revenue_trend_pct}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Tendance des revenus (30 derniers jours)</h2>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends.daily_data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCFA(v)} labelFormatter={(l) => `Date: ${l}`} />
                      <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Ventes journalières</h2>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends.daily_data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="sales_count" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "compare" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Comparer deux périodes</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Période 1</p>
                    <div className="flex gap-2">
                      <input type="date" value={compP1Start} onChange={(e) => setCompP1Start(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm flex-1" />
                      <input type="date" value={compP1End} onChange={(e) => setCompP1End(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm flex-1" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Période 2</p>
                    <div className="flex gap-2">
                      <input type="date" value={compP2Start} onChange={(e) => setCompP2Start(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm flex-1" />
                      <input type="date" value={compP2End} onChange={(e) => setCompP2End(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm flex-1" />
                    </div>
                  </div>
                </div>
                <Button onClick={handleCompare} className="mt-4">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Comparer
                </Button>
              </CardContent>
            </Card>

            {comparison && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Résultats</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: "Ventes", p1: comparison.period1.sales_count, p2: comparison.period2.sales_count, change: comparison.changes.sales_count, format: (v: number) => v.toString() },
                        { label: "Revenu", p1: comparison.period1.revenue, p2: comparison.period2.revenue, change: comparison.changes.revenue, format: formatCFA },
                        { label: "Dépenses", p1: comparison.period1.expenses, p2: comparison.period2.expenses, change: comparison.changes.expenses, format: formatCFA },
                        { label: "Bénéfice", p1: comparison.period1.profit, p2: comparison.period2.profit, change: comparison.changes.profit, format: formatCFA },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">{item.label}</p>
                            <p className="text-xs text-gray-500">P1: {item.format(item.p1)}</p>
                            <p className="text-xs text-gray-500">P2: {item.format(item.p2)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendIcon value={item.change} />
                            <span className={`text-sm font-bold ${item.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {item.change > 0 ? "+" : ""}{item.change}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Visualisation</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: "Revenu", Période1: comparison.period1.revenue, Période2: comparison.period2.revenue },
                            { name: "Dépenses", Période1: comparison.period1.expenses, Période2: comparison.period2.expenses },
                            { name: "Bénéfice", Période1: comparison.period1.profit, Période2: comparison.period2.profit },
                          ]}
                          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v: number) => formatCFA(v)} />
                          <Bar dataKey="Période1" fill="#f97316" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Période2" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
