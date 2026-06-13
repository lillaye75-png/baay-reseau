"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatCFA, formatDateTime, getPaymentMethodLabel, getPaymentMethodColor } from "@/lib/format";
import api, { Customer } from "@/lib/api";
import { ArrowLeft, TrendingUp, CreditCard, ShoppingCart, Package } from "lucide-react";

interface PurchaseSale {
  id: string;
  total_cfa: number;
  payment_method: string;
  is_credit: boolean;
  created_at: string;
  items: { product_id: string; quantity: number; unit_price_cfa: number; total_cfa: number }[];
}

interface CustomerStats {
  total_purchases: number;
  total_spent_cfa: number;
  total_credit_cfa: number;
  total_paid_cfa: number;
}

export default function CustomerHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = (params?.id || "") as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<PurchaseSale[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/customers/${customerId}/purchases`)
      .then((res) => {
        setCustomer(res.data.customer);
        setSales(res.data.sales);
        setStats(res.data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer?.name}</h1>
            <p className="text-sm text-gray-500">
              {customer?.nickname && `${customer.nickname} · `}
              {customer?.phone || "Pas de téléphone"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Achats</p>
                <p className="text-lg font-bold">{stats?.total_purchases || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total dépensé</p>
                <p className="text-lg font-bold">{formatCFA(stats?.total_spent_cfa || 0)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                <CreditCard className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Crédit</p>
                <p className="text-lg font-bold">{formatCFA(stats?.total_credit_cfa || 0)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Payé</p>
                <p className="text-lg font-bold">{formatCFA(stats?.total_paid_cfa || 0)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Historique des achats</h2>
          </CardHeader>
          <CardContent>
            {sales.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Aucun achat enregistré</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sales.map((sale) => (
                  <div key={sale.id} className="rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={getPaymentMethodColor(sale.payment_method) as any}>
                          {getPaymentMethodLabel(sale.payment_method)}
                        </Badge>
                        <span className="text-xs text-gray-400">{formatDateTime(sale.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sale.is_credit && <Badge variant="warning">Crédit</Badge>}
                        <span className="font-bold">{formatCFA(sale.total_cfa)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {sale.items.length} article{sale.items.length > 1 ? "s" : ""}
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
