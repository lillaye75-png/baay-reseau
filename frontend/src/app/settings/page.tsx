"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import api, { Tenant } from "@/lib/api";
import { Store, User, Shield, Smartphone, Users, UserPlus, Trash2, MessageSquare, CreditCard, Phone, Download, Upload, AlertTriangle, Save } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [shopName, setShopName] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [shopSlug, setShopSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [empForm, setEmpForm] = useState({ name: "", phone: "", password: "", role: "employee" });

  const [whatsappToken, setWhatsappToken] = useState("");
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  const [waveApiKey, setWaveApiKey] = useState("");
  const [orangeApiKey, setOrangeApiKey] = useState("");
  const [savingApis, setSavingApis] = useState(false);

  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    api.get("/tenants/me").then((res) => {
      setTenant(res.data);
      setShopName(res.data.name);
      setShopPhone(res.data.phone);
      setShopEmail(res.data.email || "");
      setShopSlug(res.data.slug || "");
    }).catch(() => {});
    if (user?.role === "owner") {
      api.get("/auth/employees").then((res) => setEmployees(res.data)).catch(() => {});
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/tenants/${tenant?.id}`, {
        name: shopName,
        phone: shopPhone,
        email: shopEmail || null,
        slug: shopSlug || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur lors de l'enregistrement", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApis = async () => {
    setSavingApis(true);
    try {
      await api.put(`/tenants/${tenant?.id}/integrations`, {
        whatsapp_api_token: whatsappToken || null,
        whatsapp_phone_number_id: whatsappPhoneId || null,
        wave_api_key: waveApiKey || null,
        orange_money_api_key: orangeApiKey || null,
      });
      showToast("APIs enregistrées !");
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur", "error");
    } finally {
      setSavingApis(false);
    }
  };

  const handleInviteEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/invite-employee", empForm);
      showToast("Employé ajouté !");
      setShowEmployeeForm(false);
      setEmpForm({ name: "", phone: "", password: "", role: "employee" });
      api.get("/auth/employees").then((res) => setEmployees(res.data));
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur", "error");
    }
  };

  const handleToggleActive = async (id: string, name: string) => {
    try {
      const res = await api.put(`/auth/employees/${id}/toggle-active`);
      showToast(`${name} ${res.data.is_active ? "activé" : "désactivé"}`);
      api.get("/auth/employees").then((res) => setEmployees(res.data));
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur", "error");
    }
  };

  const handleUpdateRole = async (id: string, role: string) => {
    try {
      await api.put(`/auth/employees/${id}`, { role });
      showToast("Rôle mis à jour");
      api.get("/auth/employees").then((res) => setEmployees(res.data));
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur", "error");
    }
  };

  const handleRemoveEmployee = async (id: string, name: string) => {
    if (confirm(`Retirer "${name}" de l'équipe ?`)) {
      await api.delete(`/auth/employees/${id}`);
      showToast(`${name} retiré`, "warning");
      api.get("/auth/employees").then((res) => setEmployees(res.data));
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await api.get("/settings/backup", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `baay-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("Backup téléchargé !");
    } catch (err: any) {
      showToast("Erreur lors du backup", "error");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (confirm("⚠️ ATTENTION : Cette action est IRRÉVERSIBLE.\n\nSupprimer TOUS les produits, clients, ventes, commandes ?")) {
      if (confirm("Dernière chance : vraiment tout supprimer ?")) {
        try {
          await api.delete("/settings/data");
          showToast("Toutes les données ont été supprimées", "warning");
        } catch (err: any) {
          showToast(err.response?.data?.detail || "Erreur", "error");
        }
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm text-gray-500">Configurez votre boutique</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <Store className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Informations de la boutique</h2>
                <p className="text-sm text-gray-500">Nom, coordonnées et URL</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nom de la boutique"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Ma Boutique"
            />
            <Input
              label="Téléphone"
              type="tel"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
              placeholder="+221 77 123 45 67"
            />
            <Input
              label="Email (optionnel)"
              type="email"
              value={shopEmail}
              onChange={(e) => setShopEmail(e.target.value)}
              placeholder="boutique@email.com"
            />
            <div>
              <Input
                label="URL de votre boutique"
                value={shopSlug}
                onChange={(e) => setShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="ma-boutique"
              />
              <p className="text-xs text-gray-400 mt-1">
                Votre lien : <span className="font-medium text-primary-600">baay-reseau.vercel.app/shop/{shopSlug || "..."}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              {saved && (
                <span className="text-sm text-green-600 font-medium">Enregistré !</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Mon compte</h2>
                <p className="text-sm text-gray-500">Informations utilisateur</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Nom</span>
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Téléphone</span>
              <span className="text-sm font-medium">{user?.phone}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Rôle</span>
              <span className="text-sm font-medium capitalize">{user?.role}</span>
            </div>
          </CardContent>
        </Card>

        {user?.role === "owner" && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">WhatsApp Bot</h2>
                    <p className="text-sm text-gray-500">Configurez votre clé API WhatsApp</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 mb-3">
                  Le bot WhatsApp vous permet de gérer votre boutique par message.
                </div>
                <Input
                  label="WhatsApp API Token"
                  value={whatsappToken}
                  onChange={(e) => setWhatsappToken(e.target.value)}
                  placeholder="Votre token Meta WhatsApp Business"
                />
                <Input
                  label="Phone Number ID"
                  value={whatsappPhoneId}
                  onChange={(e) => setWhatsappPhoneId(e.target.value)}
                  placeholder="Votre Phone Number ID"
                />
                <Button onClick={handleSaveApis} disabled={savingApis} size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  {savingApis ? "Enregistrement..." : "Enregistrer les APIs"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                    <CreditCard className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Paiements</h2>
                    <p className="text-sm text-gray-500">Clés API Wave et Orange Money</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Wave API Key"
                  value={waveApiKey}
                  onChange={(e) => setWaveApiKey(e.target.value)}
                  placeholder="Clé API Wave (optionnel)"
                />
                <Input
                  label="Orange Money API Key"
                  value={orangeApiKey}
                  onChange={(e) => setOrangeApiKey(e.target.value)}
                  placeholder="Clé API Orange Money (optionnel)"
                />
                <Button onClick={handleSaveApis} disabled={savingApis} size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  {savingApis ? "Enregistrement..." : "Enregistrer les APIs"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Équipe</h2>
                      <p className="text-sm text-gray-500">{employees.length} employé(s)</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setShowEmployeeForm(!showEmployeeForm)}>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showEmployeeForm && (
                  <form onSubmit={handleInviteEmployee} className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-4">
                    <Input label="Nom" value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} required />
                    <Input label="Téléphone" value={empForm.phone} onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })} required />
                    <Input label="Mot de passe" type="password" value={empForm.password} onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })} required />
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Rôle</label>
                      <select
                        value={empForm.role}
                        onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="employee">Employé</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                    <div className="flex items-end gap-2 col-span-2 justify-end">
                      <Button variant="secondary" type="button" onClick={() => setShowEmployeeForm(false)}>Annuler</Button>
                      <Button type="submit">Ajouter</Button>
                    </div>
                  </form>
                )}
                {employees.length > 0 ? (
                  <div className="space-y-2">
                    {employees.map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{emp.name}</p>
                            <p className="text-xs text-gray-500">{emp.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={emp.role}
                            onChange={(e) => handleUpdateRole(emp.id, e.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 text-xs"
                          >
                            <option value="employee">Employé</option>
                            <option value="manager">Manager</option>
                          </select>
                          <Badge variant={emp.is_active ? "success" : "danger"}>
                            {emp.is_active ? "Actif" : "Inactif"}
                          </Badge>
                          <button
                            onClick={() => handleToggleActive(emp.id, emp.name)}
                            className={`rounded p-1 ${emp.is_active ? "text-orange-600 hover:text-orange-800" : "text-green-600 hover:text-green-800"}`}
                            title={emp.is_active ? "Désactiver" : "Activer"}
                          >
                            {emp.is_active ? "⏸" : "▶"}
                          </button>
                          <button onClick={() => handleRemoveEmployee(emp.id, emp.name)} className="text-red-600 hover:text-red-800 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">Aucun employé ajouté</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Données</h2>
                    <p className="text-sm text-gray-500">Backup et gestion des données</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="secondary" onClick={handleBackup} disabled={backupLoading} className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  {backupLoading ? "Préparation..." : "Télécharger un backup"}
                </Button>
                <Button variant="secondary" onClick={handleDeleteAllData} className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer toutes les données
                </Button>
                <p className="text-xs text-gray-400">⚠️ La suppression est irréversible. Faites un backup d&apos;abord.</p>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Support & Contact</h2>
                <p className="text-sm text-gray-500">Besoin d&apos;aide ?</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Téléphone</span>
                <a href="tel:+221776621410" className="text-sm font-medium text-primary-600 hover:underline">+221 77 662 14 10</a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">WhatsApp</span>
                <a href="https://wa.me/221708372127" target="_blank" className="text-sm font-medium text-green-600 hover:underline">+221 70 837 21 27</a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Email</span>
                <a href="mailto:layedevops@gmail.com" className="text-sm font-medium text-primary-600 hover:underline">layedevops@gmail.com</a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Plan d&apos;abonnement</h2>
                <p className="text-sm text-gray-500">Votre formule actuelle</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Plan Gratuit</p>
                <p className="text-sm text-gray-500">Jusqu&apos;à 50 produits, 100 clients</p>
              </div>
              <Button variant="secondary">Passer au Premium</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
