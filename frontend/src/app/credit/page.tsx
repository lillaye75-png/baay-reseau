"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatCFA } from "@/lib/format";
import api, { Customer } from "@/lib/api";
import { CreditCard, AlertTriangle, TrendingDown, Search, X, CheckCircle, DollarSign } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

export default function CreditPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState(0);

  useEffect(() => {
    loadDebtors();
  }, []);

  const loadDebtors = () => {
    api.get("/customers/credit-debtors/")
      .then((res) => setCustomers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.nickname && c.nickname.toLowerCase().includes(search.toLowerCase()))
  );

  const totalDebt = customers.reduce((sum, c) => sum + c.total_credit_cfa, 0);

  const handlePay = async () => {
    if (!payingCustomer || payAmount <= 0) return;
    try {
      const res = await api.post(`/customers/${payingCustomer.id}/pay-credit`, {
        amount: payAmount,
        description: "Remboursement via POS",
      });
      showToast(`Remboursement de ${formatCFA(res.data.paid)} enregistré !`);
      setPayingCustomer(null);
      setPayAmount(0);
      loadDebtors();
    } catch (err) {
      showToast("Erreur lors du remboursement", "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crédit / Tontines</h1>
          <p className="text-sm text-gray-500">Gérez les crédits de vos clients (borom dënn)</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/25">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total dettes</p>
                <p className="text-2xl font-bold text-red-600">{formatCFA(totalDebt)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/25">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Clients endettés</p>
                <p className="text-2xl font-bold">{filtered.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/25">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Moyenne dette</p>
                <p className="text-2xl font-bold">
                  {filtered.length > 0 ? formatCFA(Math.round(totalDebt / filtered.length)) : "0 CFA"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {payingCustomer && (
          <Card className="border-primary-200 bg-primary-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-primary-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Rembourser {payingCustomer.name}</h3>
                    <p className="text-sm text-gray-500">Dette actuelle: {formatCFA(payingCustomer.total_credit_cfa)}</p>
                  </div>
                </div>
                <button onClick={() => { setPayingCustomer(null); setPayAmount(0); }} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Input
                    label="Montant à rembourser (CFA)"
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseInt(e.target.value) || 0)}
                    max={payingCustomer.total_credit_cfa}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPayAmount(payingCustomer.total_credit_cfa)}
                  >
                    Tout rembourser
                  </Button>
                  <Button onClick={handlePay} disabled={payAmount <= 0}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Clients endettés</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun client endetté</p>
                <p className="text-sm text-gray-400">Les crédits apparaîtront ici</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between py-4 hover:bg-gray-50 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {customer.name}
                          {customer.nickname && (
                            <span className="ml-2 text-sm text-gray-400">({customer.nickname})</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {customer.phone || customer.whatsapp_number || "Pas de téléphone"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">{formatCFA(customer.total_credit_cfa)}</p>
                        <p className="text-xs text-gray-400">dette totale</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setPayingCustomer(customer);
                          setPayAmount(customer.total_credit_cfa);
                        }}
                      >
                        Rembourser
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
