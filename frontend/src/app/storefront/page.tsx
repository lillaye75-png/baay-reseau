"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth-context";
import api, { Tenant } from "@/lib/api";
import { Store, Globe, Copy, CheckCircle, ExternalLink } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

interface StoreSettings {
  is_enabled: boolean;
  store_name: string | null;
  store_description: string | null;
  banner_url: string | null;
  theme_color: string;
  delivery_fee_cfa: number;
  min_order_cfa: number;
  accepts_wave: boolean;
  accepts_orange_money: boolean;
  accepts_cash_on_delivery: boolean;
  phone: string | null;
  whatsapp: string | null;
}

export default function StorefrontPage() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    store_name: "",
    store_description: "",
    theme_color: "#ea580c",
    delivery_fee_cfa: 0,
    min_order_cfa: 0,
    phone: "",
    whatsapp: "",
    accepts_wave: true,
    accepts_orange_money: true,
    accepts_cash_on_delivery: true,
  });

  useEffect(() => {
    Promise.all([
      api.get("/tenants/me"),
      api.get("/storefront/settings"),
    ]).then(([t, s]) => {
      setTenant(t.data);
      setSettings(s.data);
      setForm({
        store_name: s.data.store_name || t.data.name,
        store_description: s.data.store_description || "",
        theme_color: s.data.theme_color || "#ea580c",
        delivery_fee_cfa: s.data.delivery_fee_cfa,
        min_order_cfa: s.data.min_order_cfa,
        phone: s.data.phone || t.data.phone,
        whatsapp: s.data.whatsapp || "",
        accepts_wave: s.data.accepts_wave,
        accepts_orange_money: s.data.accepts_orange_money,
        accepts_cash_on_delivery: s.data.accepts_cash_on_delivery,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/storefront/settings", {
        is_enabled: settings?.is_enabled || false,
        ...form,
      });
      showToast("Paramètres enregistrés !");
    } catch { showToast("Erreur", "error"); }
    setSaving(false);
  };

  const toggleOnline = async () => {
    if (!settings) return;
    try {
      await api.put("/storefront/settings", { is_enabled: !settings.is_enabled, ...form });
      setSettings({ ...settings, is_enabled: !settings.is_enabled });
      showToast(settings.is_enabled ? "Boutique désactivée" : "Boutique activée !");
    } catch { showToast("Erreur", "error"); }
  };

  const storeUrl = tenant ? `${window.location.origin}/shop/${tenant.slug}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    showToast("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <DashboardLayout><div className="flex justify-center py-16"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Boutique en ligne</h1>
            <p className="text-sm text-gray-500">Configurez votre e-commerce</p>
          </div>
          <Badge variant={settings?.is_enabled ? "success" : "danger"}>
            {settings?.is_enabled ? "En ligne" : "Hors ligne"}
          </Badge>
        </div>

        {storeUrl && (
          <Card className="border-primary-200 bg-primary-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-medium text-primary-800">Lien de votre boutique</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white rounded-lg px-3 py-2 border border-primary-200 truncate">{storeUrl}</code>
                <button onClick={handleCopy} className="p-2 rounded-lg bg-primary-100 hover:bg-primary-200 transition-colors">
                  {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-primary-600" />}
                </button>
                <a href={storeUrl} target="_blank" className="p-2 rounded-lg bg-primary-100 hover:bg-primary-200 transition-colors">
                  <ExternalLink className="h-4 w-4 text-primary-600" />
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Activer la boutique</h3>
                <p className="text-sm text-gray-500">Rendre la boutique visible en ligne</p>
              </div>
              <button onClick={toggleOnline} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings?.is_enabled ? "bg-green-600" : "bg-gray-300"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings?.is_enabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Informations</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Nom de la boutique" value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.store_description} onChange={(e) => setForm({ ...form, store_description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <Input label="Couleur thème" type="color" value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} className="h-10" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Livraison & Paiement</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Frais de livraison (CFA)" type="number" value={form.delivery_fee_cfa} onChange={(e) => setForm({ ...form, delivery_fee_cfa: parseInt(e.target.value) || 0 })} />
            <Input label="Commande minimum (CFA)" type="number" value={form.min_order_cfa} onChange={(e) => setForm({ ...form, min_order_cfa: parseInt(e.target.value) || 0 })} />
            <Input label="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="221771234567" />
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Méthodes acceptées</label>
              {[
                { key: "accepts_wave", label: "Wave" },
                { key: "accepts_orange_money", label: "Orange Money" },
                { key: "accepts_cash_on_delivery", label: "Paiement à la livraison" },
              ].map((m) => (
                <label key={m.key} className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={(form as any)[m.key]} onChange={(e) => setForm({ ...form, [m.key]: e.target.checked })} className="rounded" />
                  {m.label}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </DashboardLayout>
  );
}
