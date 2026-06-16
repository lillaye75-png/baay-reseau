"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { formatCFA } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  Key, Plus, Trash2, ToggleLeft, ToggleRight, Shield, Copy, Check,
  Users, UserPlus, Trash, Power, PowerOff, Building2, BarChart3,
  RefreshCw, Eye, EyeOff, Database, Globe, Package, ShoppingCart,
} from "lucide-react";
import { showToast } from "@/components/ui/Toast";

const SUPER_ADMIN_PHONES = ["776621410", "708372127"];

interface Licence {
  id: string;
  licence_key: string;
  tier: string;
  is_active: boolean;
  assigned_to: string | null;
  duration_days: number;
  expires_at: string | null;
  activated_at: string | null;
  created_at: string;
}

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  is_active: boolean;
  tenant_id: string;
  tenant_name: string | null;
  tenant_active: boolean | null;
  created_at: string;
}

interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  phone: string;
  subscription_plan: string;
  is_active: boolean;
  wizard_completed: boolean;
  license_expires_at: string | null;
  user_count: number;
  created_at: string;
}

interface AdminStats {
  users: number;
  tenants: number;
  active_tenants: number;
  products: number;
  sales: number;
  total_revenue_cfa: number;
  customers: number;
  orders: number;
  licences: number;
  active_licences: number;
}

export default function LicencesPage() {
  const { user } = useAuth();
  const [licences, setLicences] = useState<Licence[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tab, setTab] = useState<"stats" | "licences" | "users" | "tenants">("stats");
  const [showLicenceForm, setShowLicenceForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [licenceForm, setLicenceForm] = useState({ tier: "pro", duration_days: 30 });
  const [userForm, setUserForm] = useState({ name: "", phone: "", password: "admin123", shop_name: "" });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const isSuperAdmin = SUPER_ADMIN_PHONES.includes(user?.phone || "");

  useEffect(() => {
    if (isSuperAdmin) loadAll();
  }, [isSuperAdmin]);

  const loadAll = () => {
    api.get("/licences/all").then((res) => setLicences(res.data)).catch(() => {});
    api.get("/licences/users").then((res) => setUsers(res.data)).catch(() => {});
    api.get("/licences/tenants").then((res) => setTenants(res.data)).catch(() => {});
    api.get("/licences/stats").then((res) => setStats(res.data)).catch(() => {});
  };

  const handleGenerateLicence = async () => {
    setLoading(true);
    try {
      const res = await api.post("/licences/generate", licenceForm);
      showToast(`Licence générée: ${res.data.key}`);
      setShowLicenceForm(false);
      loadAll();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur", "error");
    } finally { setLoading(false); }
  };

  const handleToggleLicence = async (id: string) => {
    try {
      const res = await api.put(`/licences/${id}/toggle`);
      showToast(res.data.is_active ? "Activée — compte réactivé" : "Désactivée — compte déconnecté");
      loadAll();
    } catch (err: any) { showToast(err.response?.data?.detail || "Erreur", "error"); }
  };

  const handleDeleteLicence = async (id: string) => {
    if (!confirm("Supprimer cette licence ?")) return;
    try {
      await api.delete(`/licences/${id}`);
      showToast("Licence supprimée");
      loadAll();
    } catch (err: any) { showToast(err.response?.data?.detail || "Erreur", "error"); }
  };

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.phone) { showToast("Nom et téléphone requis", "error"); return; }
    setLoading(true);
    try {
      await api.post("/licences/users", userForm);
      showToast("Compte créé");
      setShowUserForm(false);
      setUserForm({ name: "", phone: "", password: "admin123", shop_name: "" });
      loadAll();
    } catch (err: any) { showToast(err.response?.data?.detail || "Erreur", "error"); }
    finally { setLoading(false); }
  };

  const handleToggleUser = async (id: string) => {
    try {
      const res = await api.put(`/licences/users/${id}/toggle-active`);
      showToast(`${res.data.name} ${res.data.is_active ? "activé" : "désactivé"}`);
      loadAll();
    } catch (err: any) { showToast(err.response?.data?.detail || "Erreur", "error"); }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Désactiver "${name}" ?`)) return;
    try {
      await api.delete(`/licences/users/${id}`);
      showToast(`${name} désactivé`);
      loadAll();
    } catch (err: any) { showToast(err.response?.data?.detail || "Erreur", "error"); }
  };

  const handleResetPassword = async (id: string, name: string) => {
    const pw = prompt(`Nouveau mot de passe pour "${name}" :`, "admin123");
    if (!pw) return;
    try {
      await api.post(`/licences/users/${id}/reset-password`, { password: pw });
      showToast(`Mot de passe réinitialisé pour ${name}`);
    } catch (err: any) { showToast(err.response?.data?.detail || "Erreur", "error"); }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (!confirm(`⚠️ Supprimer "${name}" et toutes ses données ?`)) return;
    try {
      await api.delete(`/licences/tenants/${id}`);
      showToast(`${name} supprimé`);
      loadAll();
    } catch (err: any) { showToast(err.response?.data?.detail || "Erreur", "error"); }
  };

  const handleWipeAll = async () => {
    if (!confirm("⚠️ Supprimer TOUTES les données ? Irréversible !")) return;
    if (!confirm("Dernière chance : vraiment tout supprimer ?")) return;
    try {
      const res = await api.delete("/licences/wipe-all");
      showToast(res.data.message);
      loadAll();
    } catch (err: any) { showToast(err.response?.data?.detail || "Erreur", "error"); }
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
            <p className="text-gray-500">Seul le super admin peut accéder à cette page</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Panel</h1>
            <p className="text-sm text-gray-500">Gestion complète de la plateforme</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={loadAll}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
            <Button variant="danger" onClick={handleWipeAll}>
              <Trash className="h-4 w-4 mr-1" />
              Wipe All
            </Button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-200 pb-2 overflow-x-auto">
          {[
            { id: "stats" as const, label: "Stats", icon: BarChart3 },
            { id: "licences" as const, label: `Licences (${licences.length})`, icon: Key },
            { id: "users" as const, label: `Comptes (${users.length})`, icon: Users },
            { id: "tenants" as const, label: `Tenants (${tenants.length})`, icon: Building2 },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                tab === t.id ? "bg-primary-100 text-primary-700" : "text-gray-500 hover:bg-gray-100"
              }`}>
              <t.icon className="h-4 w-4 inline mr-1" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "stats" && stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Utilisateurs", value: stats.users, icon: Users, color: "from-blue-400 to-blue-600" },
              { label: "Tenants actifs", value: `${stats.active_tenants}/${stats.tenants}`, icon: Building2, color: "from-green-400 to-green-600" },
              { label: "Produits", value: stats.products, icon: Package, color: "from-purple-400 to-purple-600" },
              { label: "Ventes totales", value: stats.sales, icon: ShoppingCart, color: "from-orange-400 to-orange-600" },
              { label: "Revenu total", value: formatCFA(stats.total_revenue_cfa), icon: BarChart3, color: "from-yellow-400 to-yellow-600" },
            ].map((s) => (
              <Card key={s.label} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} shadow-lg`}>
                      <s.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{s.label}</p>
                      <p className="text-lg font-bold">{s.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-red-600 shadow-lg">
                    <Key className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Licences actives</p>
                    <p className="text-lg font-bold">{stats.active_licences}/{stats.licences}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 shadow-lg">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Clients total</p>
                    <p className="text-lg font-bold">{stats.customers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-lg">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Commandes</p>
                    <p className="text-lg font-bold">{stats.orders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "licences" && (
          <>
            <div className="flex justify-end">
              <Button onClick={() => setShowLicenceForm(!showLicenceForm)}>
                <Plus className="h-4 w-4 mr-1" /> Générer
              </Button>
            </div>
            {showLicenceForm && (
              <Card>
                <CardHeader><h3 className="font-semibold">Nouvelle licence</h3></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                      <select value={licenceForm.tier} onChange={(e) => setLicenceForm({ ...licenceForm, tier: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                    <Input label="Durée (jours)" type="number" value={licenceForm.duration_days}
                      onChange={(e) => setLicenceForm({ ...licenceForm, duration_days: parseInt(e.target.value) || 30 })} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleGenerateLicence} disabled={loading}>{loading ? "Génération..." : "Générer"}</Button>
                    <Button variant="secondary" onClick={() => setShowLicenceForm(false)}>Annuler</Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card><CardContent className="p-0"><div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clé</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durée</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expire</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-200">
                  {licences.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{l.licence_key}</code>
                        <button onClick={() => copyKey(l.licence_key)} className="text-gray-400 hover:text-primary-600">
                          {copied === l.licence_key ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div></td>
                      <td className="px-4 py-3"><Badge variant={l.tier === "pro" ? "warning" : l.tier === "enterprise" ? "success" : "default"}>{l.tier}</Badge></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{l.duration_days}j</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{l.expires_at ? new Date(l.expires_at).toLocaleDateString("fr") : "—"}</td>
                      <td className="px-4 py-3"><Badge variant={l.is_active ? "success" : "danger"}>{l.is_active ? "Active" : "Inactive"}</Badge></td>
                      <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleToggleLicence(l.id)} className="p-1.5 rounded-lg hover:bg-gray-100" title={l.is_active ? "Désactiver" : "Activer"}>
                          {l.is_active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                        </button>
                        <button onClick={() => handleDeleteLicence(l.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div></td>
                    </tr>
                  ))}
                  {licences.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucune licence</td></tr>}
                </tbody>
              </table>
            </div></CardContent></Card>
          </>
        )}

        {tab === "users" && (
          <>
            <div className="flex justify-end">
              <Button onClick={() => setShowUserForm(!showUserForm)}>
                <UserPlus className="h-4 w-4 mr-1" /> Créer un compte
              </Button>
            </div>
            {showUserForm && (
              <Card>
                <CardHeader><h3 className="font-semibold">Nouveau compte</h3></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Nom" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="Nom complet" />
                    <Input label="Téléphone" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} placeholder="771234567" />
                    <Input label="Mot de passe" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                    <Input label="Boutique (optionnel)" value={userForm.shop_name} onChange={(e) => setUserForm({ ...userForm, shop_name: e.target.value })} placeholder="Ma Boutique" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateUser} disabled={loading}>{loading ? "Création..." : "Créer"}</Button>
                    <Button variant="secondary" onClick={() => setShowUserForm(false)}>Annuler</Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card><CardContent className="p-0"><div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boutique</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boutique</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">{u.name.charAt(0).toUpperCase()}</div>
                        <span className="font-medium text-sm">{u.name}</span>
                        {SUPER_ADMIN_PHONES.includes(u.phone) && <Badge variant="warning" className="text-[10px]">SUPER</Badge>}
                      </div></td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{u.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{u.tenant_name || "—"}</td>
                      <td className="px-4 py-3"><Badge variant={u.is_active ? "success" : "danger"}>{u.is_active ? "Actif" : "Inactif"}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={u.tenant_active ? "success" : "danger"}>{u.tenant_active ? "Active" : "Inactive"}</Badge></td>
                      <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">
                        {!SUPER_ADMIN_PHONES.includes(u.phone) && (<>
                          <button onClick={() => handleToggleUser(u.id)} className="p-1.5 rounded-lg hover:bg-gray-100" title={u.is_active ? "Désactiver" : "Activer"}>
                            {u.is_active ? <PowerOff className="h-4 w-4 text-orange-500" /> : <Power className="h-4 w-4 text-green-500" />}
                          </button>
                          <button onClick={() => handleResetPassword(u.id, u.name)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Réinitialiser mot de passe">
                            <Key className="h-4 w-4 text-blue-500" />
                          </button>
                          <button onClick={() => handleDeleteUser(u.id, u.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Désactiver">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>)}
                      </div></td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucun compte</td></tr>}
                </tbody>
              </table>
            </div></CardContent></Card>
          </>
        )}

        {tab === "tenants" && (
          <Card><CardContent className="p-0"><div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expire</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><span className="font-medium text-sm">{t.name}</span></td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">/shop/{t.slug}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.phone}</td>
                    <td className="px-4 py-3"><Badge variant={t.subscription_plan === "enterprise" ? "success" : t.subscription_plan === "pro" ? "warning" : "default"}>{t.subscription_plan}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={t.is_active ? "success" : "danger"}>{t.is_active ? "Actif" : "Inactif"}</Badge></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.user_count}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.license_expires_at ? new Date(t.license_expires_at).toLocaleDateString("fr") : "Essai 7j"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteTenant(t.id, t.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Aucun tenant</td></tr>}
              </tbody>
            </table>
          </div></CardContent></Card>
        )}
      </div>
    </DashboardLayout>
  );
}
