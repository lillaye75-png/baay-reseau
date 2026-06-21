"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Store, User, Key, Check, ArrowRight, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { showToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";

export default function WizardPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [shopName, setShopName] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [shopSlug, setShopSlug] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [licenceKey, setLicenceKey] = useState("");
  const [saving, setSaving] = useState(false);

  const plans = [
    { id: "free", name: "Free", desc: "50 produits, 100 clients, 7 jours", color: "border-gray-200" },
    { id: "starter", name: "Starter", desc: "5 000 F/mois — 200 produits, boutique en ligne", color: "border-blue-500" },
    { id: "pro", name: "Pro", desc: "10 000 F/mois — 500 produits, WhatsApp Bot, IA", color: "border-primary-500 ring-2 ring-primary-500/20" },
    { id: "enterprise", name: "Enterprise", desc: "15 000 F/mois — Illimité, multi-magasin", color: "border-yellow-500 ring-2 ring-yellow-500/20" },
  ];

  useEffect(() => {
    api.get("/tenants/me").then((res) => {
      if (res.data.wizard_completed) {
        window.location.href = "/dashboard";
      } else {
        setShopName(res.data.name === "My Shop" ? "" : res.data.name);
        setShopPhone(res.data.phone || "");
        setShopEmail(res.data.email || "");
        setShopSlug(res.data.slug || "");
      }
    }).catch(() => {});
  }, []);

  const handleFinish = async () => {
    setSaving(true);
    try {
      await api.put(`/tenants/${user?.tenant_id}`, {
        name: shopName || "My Shop",
        phone: shopPhone || user?.phone,
        email: shopEmail || null,
        slug: shopSlug || undefined,
        wizard_completed: true,
      });

      if (selectedPlan !== "free" && licenceKey.trim()) {
        try {
          await api.post("/licences/activate", { key: licenceKey.trim() });
        } catch {
          showToast("Licence invalide — plan Free appliqué", "warning");
        }
      }

      localStorage.removeItem("wizard_needed");
      showToast("Bienvenue ! Configuration terminée");
      window.location.href = "/dashboard";
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mx-auto mb-4 shadow-lg">
            <span className="text-xl font-bold text-white">BR</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenue sur Naatal ERP !</h1>
          <p className="text-sm text-gray-500 mt-1">Configurons votre boutique en quelques étapes</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 w-2 rounded-full transition-all ${step >= s ? "bg-primary-600 w-8" : "bg-gray-300"}`} />
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Store className="h-6 w-6 text-primary-600" />
                <h2 className="text-lg font-semibold">Informations de la boutique</h2>
              </div>
              <Input label="Nom de la boutique" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Ma Boutique" />
              <Input label="Téléphone" type="tel" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} placeholder="+221 77 123 45 67" />
              <Input label="Email (optionnel)" type="email" value={shopEmail} onChange={(e) => setShopEmail(e.target.value)} placeholder="boutique@email.com" />
              <Input label="URL de la boutique" value={shopSlug} onChange={(e) => setShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="ma-boutique" />
              <p className="text-xs text-gray-400">Lien : baay-reseau.vercel.app/shop/{shopSlug || "..."}</p>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)}>
                  Suivant <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Key className="h-6 w-6 text-primary-600" />
                <h2 className="text-lg font-semibold">Choisissez votre plan</h2>
              </div>
              <div className="space-y-3">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    className={`w-full rounded-xl border-2 p-4 text-left transition-all ${p.color} ${selectedPlan === p.id ? "ring-2 ring-primary-500" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-sm text-gray-500">{p.desc}</p>
                      </div>
                      {selectedPlan === p.id && <Check className="h-5 w-5 text-primary-600" />}
                    </div>
                  </button>
                ))}
              </div>
              {selectedPlan !== "free" && (
                <Input
                  label="Clé de licence (optionnel — vous pouvez l'entrer plus tard)"
                  value={licenceKey}
                  onChange={(e) => setLicenceKey(e.target.value.toUpperCase())}
                  placeholder="BAY-P-XXXX-XXXX-XXXX"
                  className="font-mono"
                />
              )}
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Retour
                </Button>
                <Button onClick={() => setStep(3)}>
                  Suivant <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <User className="h-6 w-6 text-primary-600" />
                <h2 className="text-lg font-semibold">Résumé</h2>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between"><span className="text-gray-600">Boutique</span><span className="font-medium">{shopName || "Ma Boutique"}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Téléphone</span><span className="font-medium">{shopPhone || user?.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">URL</span><span className="font-medium">/shop/{shopSlug || "..."}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Plan</span><span className="font-medium uppercase">{selectedPlan}</span></div>
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Retour
                </Button>
                <Button onClick={handleFinish} disabled={saving}>
                  {saving ? "Enregistrement..." : "Commencer !"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
