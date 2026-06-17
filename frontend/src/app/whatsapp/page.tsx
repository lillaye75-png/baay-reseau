"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatCFA } from "@/lib/format";
import api from "@/lib/api";
import { showToast } from "@/components/ui/Toast";
import {
  MessageSquare,
  Bot,
  Smartphone,
  Zap,
  Send,
  Package,
  CreditCard,
  BarChart3,
  ArrowRight,
  ShoppingCart,
  Users,
  Megaphone,
} from "lucide-react";

const commandExamples = [
  {
    category: "Ventes",
    icon: ShoppingCart,
    color: "green",
    examples: [
      { wolof: "Jënd 2 chargeurs pour 15000 CFA", french: "Enregistrer une vente de 2 chargeurs à 15 000 CFA" },
      { wolof: "Vendu 1 écran Samsung pour 85000", french: "Ajouter une vente au comptoir" },
      { wolof: "Jënd 3 clés USB cash", french: "Vente en espèces" },
    ],
  },
  {
    category: "Crédit",
    icon: CreditCard,
    color: "red",
    examples: [
      { wolof: "Takk 5000 CFA ci tab bi Amadou", french: "Ajouter 5 000 CFA de crédit à Amadou" },
      { wolof: "Amadou a tene 10000 CFA", french: "Amadou doit 10 000 CFA" },
      { wolof: "List les clients qui ont du crédit", french: "Afficher les clients endettés" },
    ],
  },
  {
    category: "Stock",
    icon: Package,
    color: "blue",
    examples: [
      { wolof: "Ana stock bi chargeurs?", french: "Vérifier le stock des chargeurs" },
      { wolof: "Ajoute 20 câbles Type-C au stock", french: "Ajouter du stock" },
      { wolof: "Quels produits sont en stock bas?", french: "Alerte stock bas" },
    ],
  },
  {
    category: "Rapports",
    icon: BarChart3,
    color: "purple",
    examples: [
      { wolof: "Rapport des ventes du jour", french: "Résumé des ventes aujourd'hui" },
      { wolof: "Combien j'ai vendu aujourd'hui?", french: "Total des ventes du jour" },
      { wolof: "Les 5 meilleurs produits", french: "Top des produits vendus" },
    ],
  },
];

const colorMap: Record<string, string> = {
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-red-600",
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
};

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [campaignTab, setCampaignTab] = useState<"bot" | "campaigns">("bot");
  const [campaignName, setCampaignName] = useState("");
  const [campaignMessage, setCampaignMessage] = useState("");
  const [campaignRecipients, setCampaignRecipients] = useState("all");
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState({ total_customers: 0, customers_with_phone: 0, customers_with_credit: 0 });

  useEffect(() => {
    api.get("/whatsapp/campaigns").then((res) => setStats(res.data)).catch(() => {});
  }, []);

  const handleSendCampaign = async () => {
    if (!campaignMessage.trim()) {
      showToast("Entrez un message", "error");
      return;
    }
    setSending(true);
    try {
      const res = await api.post("/whatsapp/campaigns", {
        name: campaignName || `Campagne ${new Date().toLocaleDateString("fr-SN")}`,
        message: campaignMessage,
        recipients: campaignRecipients,
      });
      showToast(`${res.data.sent_count} message(s) envoyé(s) !`);
      setCampaignMessage("");
      setCampaignName("");
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur lors de l'envoi", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
          <p className="text-sm text-gray-500">
            Bot IA et campagnes de messages — en Wolof, Français ou Anglais
          </p>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 max-w-md">
          <button
            onClick={() => setCampaignTab("bot")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              campaignTab === "bot" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Bot className="h-4 w-4 inline mr-2" />
            Bot IA
          </button>
          <button
            onClick={() => setCampaignTab("campaigns")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              campaignTab === "campaigns" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Megaphone className="h-4 w-4 inline mr-2" />
            Campagnes
          </button>
        </div>

        {campaignTab === "bot" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/25">
                    <MessageSquare className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Comment ça marche</h2>
                    <p className="text-sm text-gray-500">
                      Envoyez un simple message WhatsApp pour tout gérer
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
                        <Smartphone className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-green-800">1. Envoyez</span>
                    </div>
                    <p className="text-sm text-green-700">Écrivez en Wolof, Français ou Anglais</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-blue-800">2. L&apos;IA comprend</span>
                    </div>
                    <p className="text-sm text-blue-700">L&apos;assistant analyse votre message</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-purple-800">3. C&apos;est fait</span>
                    </div>
                    <p className="text-sm text-purple-700">La base de données est mise à jour</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold">Exemples de commandes</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {commandExamples.map((cat, i) => (
                    <button
                      key={cat.category}
                      onClick={() => setActiveTab(i)}
                      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                        activeTab === i
                          ? "bg-primary-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <cat.icon className="h-4 w-4" />
                      {cat.category}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {commandExamples[activeTab].examples.map((ex, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-[8px] text-white font-bold">W</span>
                          </div>
                          <span className="text-sm font-mono text-gray-700">{ex.wolof}</span>
                        </div>
                      </div>
                      <div className="px-4 py-2 flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-500">{ex.french}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Statut du bot</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-gray-600">Bot WhatsApp actif</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Webhook</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">/api/v1/whatsapp/webhook</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Langues</span>
                    <span>Wolof, Français, Anglais</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">IA</span>
                    <span>GPT-4o-mini</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Langues supportées</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇸🇳</span>
                    <div>
                      <p className="font-medium">Wolof</p>
                      <p className="text-xs text-gray-500">Langue principale</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇫🇷</span>
                    <div>
                      <p className="font-medium">Français</p>
                      <p className="text-xs text-gray-500">Interface complète</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇬🇧</span>
                    <div>
                      <p className="font-medium">English</p>
                      <p className="text-xs text-gray-500">Basic support</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary-200 bg-primary-50">
              <CardContent className="p-4">
                <p className="text-sm text-primary-800 font-medium mb-1">Configuration requise</p>
                <p className="text-xs text-primary-600">
                  Pour activer le bot, configurez votre <code className="bg-primary-100 px-1 rounded">WHATSAPP_API_TOKEN</code> et <code className="bg-primary-100 px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code> dans le fichier <code className="bg-primary-100 px-1 rounded">.env</code>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {campaignTab === "campaigns" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold">Nouvelle campagne</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nom de la campagne</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Promo du mois, Relance crédit..."
                    className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Destinataires</label>
                  <select
                    value={campaignRecipients}
                    onChange={(e) => setCampaignRecipients(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="all">Tous les clients ({stats.customers_with_phone})</option>
                    <option value="credit">Clients avec crédit ({stats.customers_with_credit})</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    value={campaignMessage}
                    onChange={(e) => setCampaignMessage(e.target.value)}
                    placeholder="Bonjour ! Nous avons une promotion spéciale pour vous..."
                    rows={5}
                    className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <Button onClick={handleSendCampaign} disabled={sending}>
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? "Envoi en cours..." : "Envoyer la campagne"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Statistiques</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-600">Total clients</span>
                  </div>
                  <span className="font-bold">{stats.total_customers}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-600">Avec téléphone</span>
                  </div>
                  <span className="font-bold">{stats.customers_with_phone}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-gray-600">Avec crédit</span>
                  </div>
                  <span className="font-bold">{stats.customers_with_credit}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-800 font-medium mb-1">Conseils</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>- Messages promotionnels, relances crédit</li>
                  <li>- Notifications de nouveautés</li>
                  <li>- Remerciements aux clients fidèles</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}
