"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { formatCFA, formatDateTime } from "@/lib/format";
import api from "@/lib/api";
import { Wallet, Plus, Trash2, X, TrendingDown, Filter } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount_cfa: number;
  expense_date: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Courant: "bg-blue-100 text-blue-800",
  Loyer: "bg-purple-100 text-purple-800",
  Internet: "bg-cyan-100 text-cyan-800",
  Transport: "bg-yellow-100 text-yellow-800",
  Stock: "bg-orange-100 text-orange-800",
  Salaire: "bg-green-100 text-green-800",
  Autre: "bg-gray-100 text-gray-800",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [summary, setSummary] = useState<{ month_total_cfa: number; by_category: { category: string; total_cfa: number }[] } | null>(null);
  const [form, setForm] = useState({
    category: "Courant",
    description: "",
    amount_cfa: 0,
    expense_date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    Promise.all([
      api.get("/finance/expenses"),
      api.get("/finance/expenses/categories"),
      api.get("/finance/expenses/summary"),
    ]).then(([e, c, s]) => {
      setExpenses(e.data);
      setCategories(c.data);
      setSummary(s.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/finance/expenses", {
        ...form,
        expense_date: new Date(form.expense_date).toISOString(),
      });
      showToast("Dépense enregistrée");
      setShowForm(false);
      setForm({ category: "Courant", description: "", amount_cfa: 0, expense_date: new Date().toISOString().slice(0, 10) });
      const res = await api.get("/finance/expenses");
      setExpenses(res.data);
      const s = await api.get("/finance/expenses/summary");
      setSummary(s.data);
    } catch { showToast("Erreur", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette dépense ?")) return;
    try {
      await api.delete(`/finance/expenses/${id}`);
      setExpenses(expenses.filter((e) => e.id !== id));
      showToast("Dépense supprimée");
      const s = await api.get("/finance/expenses/summary");
      setSummary(s.data);
    } catch { showToast("Erreur", "error"); }
  };

  const filtered = filterCategory
    ? expenses.filter((e) => e.category === filterCategory)
    : expenses;

  const todayTotal = expenses
    .filter((e) => new Date(e.expense_date).toDateString() === new Date().toDateString())
    .reduce((s, e) => s + e.amount_cfa, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dépenses</h1>
            <p className="text-sm text-gray-500">{expenses.length} dépenses au total</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle dépense
            </Button>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-red-600">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ce mois</p>
                  <p className="text-2xl font-bold">{formatCFA(summary.month_total_cfa)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Aujourd&apos;hui</p>
                  <p className="text-2xl font-bold">{formatCFA(todayTotal)}</p>
                </div>
              </CardContent>
            </Card>
            {summary.by_category.slice(0, 2).map((cat) => (
              <Card key={cat.category}>
                <CardContent className="flex items-center gap-4">
                  <Badge variant="default" className={CATEGORY_COLORS[cat.category]}>
                    {cat.category}
                  </Badge>
                  <p className="text-lg font-bold">{formatCFA(cat.total_cfa)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Nouvelle dépense</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Montant (CFA)"
                  type="number"
                  value={form.amount_cfa}
                  onChange={(e) => setForm({ ...form, amount_cfa: parseInt(e.target.value) || 0 })}
                  required
                />
                <Input
                  label="Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Facture électricité juin"
                />
                <Input
                  label="Date"
                  type="date"
                  value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                />
                <div className="col-span-2 flex justify-end gap-2">
                  <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Enregistrer</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <Card>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune dépense</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filtered.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className={CATEGORY_COLORS[expense.category] || "bg-gray-100 text-gray-800"}>
                      {expense.category}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{expense.description || "Sans description"}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(expense.expense_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-600">-{formatCFA(expense.amount_cfa)}</span>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
