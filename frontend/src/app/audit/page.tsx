"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Activity, Package, ShoppingCart, Users, CreditCard, Settings } from "lucide-react";
import api from "@/lib/api";

const ENTITY_ICONS: Record<string, any> = {
  product: Package,
  sale: ShoppingCart,
  customer: Users,
  credit: CreditCard,
  setting: Settings,
};

const ACTION_COLORS: Record<string, string> = {
  create: "text-green-600 bg-green-50",
  update: "text-blue-600 bg-blue-50",
  delete: "text-red-600 bg-red-50",
};

interface AuditEntry {
  id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = filter ? `/audit/?entity_type=${filter}` : "/audit/";
    api.get(url)
      .then((res) => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Journal d&apos;activités</h1>
            <p className="text-sm text-gray-500">{logs.length} entrées</p>
          </div>
          <div className="flex gap-2">
            {["", "product", "sale", "customer", "credit"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filter === f
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f || "Tout"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune activité enregistrée</p>
              <p className="text-sm text-gray-400">Les actions seront enregistrées automatiquement</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const Icon = ENTITY_ICONS[log.entity_type] || Activity;
              const colorClass = ACTION_COLORS[log.action] || "text-gray-600 bg-gray-50";
              return (
                <Card key={log.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{log.user_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
                          {log.action}
                        </span>
                        <span className="text-xs text-gray-500">{log.entity_type}</span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{log.details}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("fr")}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
