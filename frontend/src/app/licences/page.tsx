"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Key, Plus, Trash2, ToggleLeft, ToggleRight, Shield, Copy, Check } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

const SUPER_ADMIN_PHONES = ["776621410", "708372127"];

export default function LicencesPage() {
  const { user } = useAuth();
  const [licences, setLicences] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tier: "pro", duration_days: 30 });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const isSuperAdmin = SUPER_ADMIN_PHONES.includes(user?.phone || "");

  useEffect(() => {
    if (isSuperAdmin) {
      api.get("/licences/all").then((res) => setLicences(res.data)).catch(() => {});
    }
  }, [isSuperAdmin]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.post("/licences/generate", form);
      showToast(`Licence générée: ${res.data.key}`);
      setShowForm(false);
      api.get("/licences/all").then((res) => setLicences(res.data));
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await api.put(`/licences/${id}/toggle`);
      showToast(res.data.is_active ? "Activée" : "Désactivée");
      api.get("/licences/all").then((res) => setLicences(res.data));
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette licence ?")) return;
    try {
      await api.delete(`/licences/${id}`);
      showToast("Licence supprimée");
      api.get("/licences/all").then((res) => setLicences(res.data));
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur", "error");
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Accès restreint</h2>
            <p className="text-gray-500">Seul le super admin peut gérer les licences</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Licences</h1>
            <p className="text-sm text-gray-500">{licences.length} licence(s) générée(s)</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" />
            Générer
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Nouvelle licence</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={form.tier}
                  onChange={(e) => setForm({ ...form, tier: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <Input
                label="Durée (jours)"
                type="number"
                value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: parseInt(e.target.value) || 30 })}
              />
              <div className="flex gap-2">
                <Button onClick={handleGenerate} disabled={loading}>
                  {loading ? "Génération..." : "Générer la licence"}
                </Button>
                <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clé</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durée</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignée</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {licences.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{l.licence_key}</code>
                        <button onClick={() => copyKey(l.licence_key)} className="text-gray-400 hover:text-primary-600">
                          {copied === l.licence_key ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={l.tier === "pro" ? "primary" : l.tier === "enterprise" ? "success" : "default"}>
                        {l.tier}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{l.duration_days}j</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{l.assigned_to ? l.assigned_to.slice(0, 8) + "..." : "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={l.is_active ? "success" : "danger"}>
                        {l.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleToggle(l.id)} className="p-1 rounded hover:bg-gray-100" title={l.is_active ? "Désactiver" : "Activer"}>
                          {l.is_active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                        </button>
                        <button onClick={() => handleDelete(l.id)} className="p-1 rounded hover:bg-red-50 text-red-600" title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {licences.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Aucune licence générée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
