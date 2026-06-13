"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import api, { Tenant } from "@/lib/api";
import { Store, User, Shield, Smartphone, Users, UserPlus, Trash2 } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [shopName, setShopName] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [empForm, setEmpForm] = useState({ name: "", phone: "", password: "" });

  useEffect(() => {
    api.get("/tenants/me").then((res) => {
      setTenant(res.data);
      setShopName(res.data.name);
      setShopPhone(res.data.phone);
      setShopEmail(res.data.email || "");
    }).catch(() => {});
    if (user?.role === "owner") {
      api.get("/auth/employees").then((res) => setEmployees(res.data)).catch(() => {});
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/tenants/${tenant?.id}`, { name: shopName, phone: shopPhone, email: shopEmail || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
    } finally {
      setSaving(false);
    }
  };

  const handleInviteEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/invite-employee", empForm);
      showToast("Employé ajouté !");
      setShowEmployeeForm(false);
      setEmpForm({ name: "", phone: "", password: "" });
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
                <p className="text-sm text-gray-500">Nom et coordonnées</p>
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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">WhatsApp Bot</h2>
                <p className="text-sm text-gray-500">Configuration du bot WhatsApp</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600 mb-2">
                Le bot WhatsApp vous permet de gérer votre boutique par message. Envoyez des commandes comme :
              </p>
              <div className="space-y-2">
                <div className="rounded-lg bg-white p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Vente :</p>
                  <p className="text-sm font-medium">&ldquo;J&apos;ai vendu 2 chargeurs pour 15 000 CFA&rdquo;</p>
                </div>
                <div className="rounded-lg bg-white p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Crédit :</p>
                  <p className="text-sm font-medium">&ldquo;Ajoute 5 000 CFA de crédit au compte de Amadou&rdquo;</p>
                </div>
                <div className="rounded-lg bg-white p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Stock :</p>
                  <p className="text-sm font-medium">&ldquo;Quel est le stock des câbles USB ?&rdquo;</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Statut : <span className="text-green-600 font-medium">Actif</span> (en développement)
              </p>
            </div>
          </CardContent>
        </Card>

        {user?.role === "owner" && (
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
                        <Badge variant={emp.is_active ? "success" : "danger"}>
                          {emp.is_active ? "Actif" : "Inactif"}
                        </Badge>
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
        )}

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
