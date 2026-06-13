"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Copy, Share2, Gift, Users } from "lucide-react";
import api from "@/lib/api";
import { showToast } from "@/components/ui/Toast";

export default function ReferralPage() {
  const [stats, setStats] = useState<any>(null);
  const [link, setLink] = useState("");

  useEffect(() => {
    api.get("/referral/code").then((res) => {
      setLink(res.data.link);
      setStats({ code: res.data.code, credits: res.data.credits });
    });
    api.get("/referral/stats").then((res) => setStats(res.data));
  }, []);

  const copyCode = () => {
    if (stats?.code) {
      navigator.clipboard.writeText(stats.code);
      showToast("Code copié !");
    }
  };

  const share = () => {
    if (navigator.share && link) {
      navigator.share({
        title: "Baay Réseau",
        text: "Rejoins Baay Réseau, le meilleur ERP pour boutiques au Sénégal !",
        url: link,
      });
    } else if (link) {
      navigator.clipboard.writeText(link);
      showToast("Lien copié !");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parrainage</h1>
          <p className="text-sm text-gray-500">Invitez d&apos;autres boutiquiers et gagnez des crédits</p>
        </div>

        <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20">
          <CardContent className="p-6 text-center">
            <Gift className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {stats?.credits?.toLocaleString() || 0} CFA de crédits
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Gagnez 5 000 CFA pour chaque boutiquier parrainé
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={copyCode}>
                <Copy className="h-4 w-4 mr-2" /> Copier le code
              </Button>
              <Button variant="secondary" onClick={share}>
                <Share2 className="h-4 w-4 mr-2" /> Partager
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-gray-400" />
              <h3 className="font-semibold">Vos parrainages</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-3xl font-bold text-primary-600">{stats?.referral_count || 0}</p>
                <p className="text-sm text-gray-500">Boutiquiers parrainés</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-3xl font-bold text-green-600">{stats?.total_credits?.toLocaleString() || 0} F</p>
                <p className="text-sm text-gray-500">Crédits gagnés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Comment ça marche ?</h3>
            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex-shrink-0">1</span>
                Partagez votre code ou lien de parrainage
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex-shrink-0">2</span>
                L&apos;autre boutiquier s&apos;inscrit avec votre code
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex-shrink-0">3</span>
                Vous recevez 5 000 CFA de crédits automatiquement
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
