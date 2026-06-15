"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Check, Crown, Zap, Building2, ExternalLink, Phone, MessageCircle } from "lucide-react";
import api from "@/lib/api";
import { showToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n";

interface Plan {
  id: string;
  name: string;
  price_cfa: number;
  features: string[];
}

const planIcons: Record<string, any> = {
  free: Zap,
  pro: Crown,
  enterprise: Building2,
};

const planColors: Record<string, string> = {
  free: "border-gray-200",
  pro: "border-primary-500 ring-2 ring-primary-500/20",
  enterprise: "border-yellow-500 ring-2 ring-yellow-500/20",
};

export default function BillingPage() {
  const { t } = useI18n();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/billing/plans").then((res) => {
      const list = Object.values(res.data) as Plan[];
      setPlans(list.sort((a, b) => a.price_cfa - b.price_cfa));
    });
    api.get("/billing/current").then((res) => setCurrent(res.data));
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (planId === "free") return;
    setLoading(true);
    try {
      const res = await api.post(`/billing/checkout?plan=${planId}`);
      if (res.data.url) {
        window.location.href = res.data.url;
      } else if (res.data.demo_mode) {
        showToast(`Plan ${planId} activé (mode démo)`);
        api.get("/billing/current").then((res) => setCurrent(res.data));
      }
    } catch {
      showToast("Erreur", "error");
    }
    setLoading(false);
  };

  const handlePortal = async () => {
    const res = await api.post("/billing/portal");
    if (res.data.url) {
      window.location.href = res.data.url;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("billing")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Choisissez le plan qui convient à votre boutique</p>
        </div>

        {current && (
          <Card className="border-primary-200 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Plan actuel</p>
                  <p className="text-lg font-bold text-primary-700 dark:text-primary-400">{current.plan?.toUpperCase()}</p>
                </div>
                {current.has_stripe && (
                  <Button variant="secondary" size="sm" onClick={handlePortal}>
                    <ExternalLink className="h-4 w-4 mr-1" /> Gérer l&apos;abonnement
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = planIcons[plan.id] || Zap;
            const isCurrent = current?.plan === plan.id;
            return (
              <Card key={plan.id} className={`relative ${planColors[plan.id]} ${isCurrent ? "ring-2 ring-primary-500" : ""}`}>
                {plan.id === "pro" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-1 text-xs font-bold text-white">
                    Populaire
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900">
                      <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      <p className="text-2xl font-bold text-primary-600">
                        {plan.price_cfa === 0 ? "Gratuit" : `${plan.price_cfa.toLocaleString()} F`}
                        {plan.price_cfa > 0 && <span className="text-sm font-normal text-gray-500">/mois</span>}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "secondary" : plan.id === "pro" ? "primary" : "secondary"}
                    disabled={isCurrent || loading}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isCurrent ? "Plan actuel" : plan.price_cfa === 0 ? "Actuel" : "Choisir ce plan"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Paiement par Mobile Money</h2>
                <p className="text-sm text-gray-500">Payez votre abonnement par Wave ou Orange Money</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 space-y-3">
              <p className="text-sm text-gray-700 font-medium">Pour payer votre licence, contactez-nous :</p>
              <div className="space-y-2">
                <a href="tel:+221776621410" className="flex items-center gap-3 rounded-lg bg-white p-3 border border-gray-200 hover:border-primary-300 transition-colors">
                  <Phone className="h-4 w-4 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium">+221 77 662 14 10</p>
                    <p className="text-xs text-gray-500">Appel ou SMS</p>
                  </div>
                </a>
                <a href="https://wa.me/221708372127" target="_blank" className="flex items-center gap-3 rounded-lg bg-white p-3 border border-gray-200 hover:border-green-300 transition-colors">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">+221 70 837 21 27</p>
                    <p className="text-xs text-gray-500">WhatsApp</p>
                  </div>
                </a>
                <a href="mailto:layedevops@gmail.com" className="flex items-center gap-3 rounded-lg bg-white p-3 border border-gray-200 hover:border-primary-300 transition-colors">
                  <span className="text-sm">📧</span>
                  <div>
                    <p className="text-sm font-medium">layedevops@gmail.com</p>
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                </a>
              </div>
              <p className="text-xs text-gray-400">Envoyez la preuve de paiement par WhatsApp ou SMS. Votre licence sera activée dans les plus brefs délais.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
