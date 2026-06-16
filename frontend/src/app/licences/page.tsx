"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  Key, Plus, Trash2, ToggleLeft, ToggleRight, Shield, Copy, Check,
  Users, UserPlus, AlertTriangle, Trash, Power, PowerOff,
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

export default function LicencesPage() {
  const { user } = useAuth();
  const [licences, setLicences] = useState<Licence[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tab, setTab] = useState<"licences" | "users">("licences");
  const [showLicenceForm, setShowLicenceForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [licenceForm, setLicenceForm] = useState({ tier: "pro", duration_days: 30 });
  const [userForm, setUserForm] = useState({ name: "", phone: "", password: "admin123", shop_name: "" });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const isSuperAdmin = SUPER_ADMIN_PHONES.includes(user?.phone || "");

  useEffect(() => {
    if (isSuperAdmin) {
      loadAll();
    }
  }, [isSuperAdmin]);

  const loadAll = () => {
    api.get("/licences/all").then((res) => setLicences(res.data)).catch(() => {});
    api.get("/licences/users").then((res) => setUsers(res.data)).catch(() => {});
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
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLicence = async (id: string) => {
    try {
      const res = await api.put(`/licences/${id}/toggle`);
      showToast(res.data.is_active ? "Licence activée — compte réactivé" : "Licence désactivée — compte déconnecté");
      loadAll();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur", "error");
    }
  };

  const handleDeleteLicence = async (id: string) => {
    if (!confirm("Supprimer cette licence ? L'utilisateur sera déconnecté.")) return;
    try {
      await api.delete(`/licences/${id}`);
      showToast("Licence supprimée");
      loadAll();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur", "error");
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.phone) {
      showToast("Nom et téléphone requis", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/licences/users", userForm);
      showToast("Compte créé avec succès");
      setShowUserForm(false);
      setUserForm({ name: "", phone: "", password: "admin123", shop_name: "" });
      loadAll();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (id: string) => {
    try {
      const res = await api.put(`/licences/users/${id}/toggle-active`);
      showToast(res.data.name + (res.data.is_active ? " activé" : " désactivé"));
      loadAll();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur", "error");
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Désactiver le compte de "${name}" ?`)) return;
    try {
      await api.delete(`/licences/users/${id}`);
      showToast(`${name} désactivé`);
      loadAll();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur", "error");
    }
  };

  const handleWipeAll = async () => {
    if (!confirm("⚠️ ATTENTION : Supprimer TOUTES les données ? Cette action est irréversible !")) return;
    if (!confirm("Dernière chance : vraiment tout supprimer ?")) return;
    try {
      const res = await api.delete("/licences/wipe-all");
      showToast(res.data.message);
      loadAll();
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
            <p className="text-gray-500">Seul le super admin peut gérer les licences et comptes</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
            <p className="text-sm text-gray-500">{licences.length} licence(s) · {users.length} compte(s)</p>
          </div>
          <Button variant="danger" onClick={handleWipeAll} className="bg-red-600 hover:bg-red-700">
            <Trash className="h-4 w-4 mr-1" />
            Wipe All
          </Button>
        </div>

        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setTab("licences")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === "licences" ? "bg-primary-100 text-primary-700" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Key className="h-4 w-4 inline mr-1" />
            Licences ({licences.length})
          </button>
          <button
            onClick={() => setTab("users")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === "users" ? "bg-primary-100 text-primary-700" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Users className="h-4 w-4 inline mr-1" />
            Comptes ({users.length})
          </button>
        </div>

        {tab === "licences" && (
          <>
            <div className="flex justify-end">
              <Button onClick={() => setShowLicenceForm(!showLicenceForm)}>
                <Plus className="h-4 w-4 mr-1" />
                Générer une licence
              </Button>
            </div>

            {showLicenceForm && (
              <Card>
                <CardHeader><h3 className="font-semibold">Nouvelle licence</h3></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={licenceForm.tier}
                      onChange={(e) => setLicenceForm({ ...licenceForm, tier: e.target.value })}
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
                    value={licenceForm.duration_days}
                    onChange={(e) => setLicenceForm({ ...licenceForm, duration_days: parseInt(e.target.value) || 30 })}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleGenerateLicence} disabled={loading}>
                      {loading ? "Génération..." : "Générer"}
                    </Button>
                    <Button variant="secondary" onClick={() => setShowLicenceForm(false)}>Annuler</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clé</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durée</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignée à</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expire</th>
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
                            <Badge variant={l.tier === "pro" ? "warning" : l.tier === "enterprise" ? "success" : "default"}>
                              {l.tier}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{l.duration_days}j</td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono">{l.assigned_to ? l.assigned_to.slice(0, 8) + "..." : "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{l.expires_at ? new Date(l.expires_at).toLocaleDateString("fr") : "—"}</td>
                          <td className="px-4 py-3">
                            <Badge variant={l.is_active ? "success" : "danger"}>
                              {l.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleToggleLicence(l.id)} className="p-1.5 rounded-lg hover:bg-gray-100" title={l.is_active ? "Désactiver (déconnecte l'utilisateur)" : "Activer"}>
                                {l.is_active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                              </button>
                              <button onClick={() => handleDeleteLicence(l.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Supprimer">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {licences.length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aucune licence générée</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {tab === "users" && (
          <>
            <div className="flex justify-end">
              <Button onClick={() => setShowUserForm(!showUserForm)}>
                <UserPlus className="h-4 w-4 mr-1" />
                Créer un compte
              </Button>
            </div>

            {showUserForm && (
              <Card>
                <CardHeader><h3 className="font-semibold">Nouveau compte</h3></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Nom complet"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      placeholder="Nom du propriétaire"
                    />
                    <Input
                      label="Téléphone"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      placeholder="771234567"
                    />
                    <Input
                      label="Mot de passe"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    />
                    <Input
                      label="Nom de la boutique (optionnel)"
                      value={userForm.shop_name}
                      onChange={(e) => setUserForm({ ...userForm, shop_name: e.target.value })}
                      placeholder="Ma Boutique"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateUser} disabled={loading}>
                      {loading ? "Création..." : "Créer le compte"}
                    </Button>
                    <Button variant="secondary" onClick={() => setShowUserForm(false)}>Annuler</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boutique</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boutique</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-sm">{u.name}</span>
                              {SUPER_ADMIN_PHONES.includes(u.phone) && (
                                <Badge variant="warning" className="text-[10px]">SUPER</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">{u.phone}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{u.tenant_name || "—"}</td>
                          <td className="px-4 py-3">
                            <Badge variant={u.role === "owner" ? "default" : "success"}>{u.role}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={u.is_active ? "success" : "danger"}>
                              {u.is_active ? "Actif" : "Inactif"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={u.tenant_active ? "success" : "danger"}>
                              {u.tenant_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!SUPER_ADMIN_PHONES.includes(u.phone) && (
                                <>
                                  <button
                                    onClick={() => handleToggleUser(u.id)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100"
                                    title={u.is_active ? "Désactiver le compte" : "Activer le compte"}
                                  >
                                    {u.is_active ? (
                                      <PowerOff className="h-4 w-4 text-orange-500" />
                                    ) : (
                                      <Power className="h-4 w-4 text-green-500" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                                    title="Désactiver le compte"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aucun compte</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
