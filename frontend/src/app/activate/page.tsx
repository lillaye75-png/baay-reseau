"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Key, Shield, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { showToast } from "@/components/ui/Toast";
import Link from "next/link";

export default function ActivatePage() {
  const [licenceKey, setLicenceKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (!licenceKey.trim()) {
      showToast("Entrez une clé de licence", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/licences/activate", { key: licenceKey.trim() });
      showToast(`Licence ${res.data.tier} activée ! Valide ${res.data.expires_at ? "jusqu'au " + new Date(res.data.expires_at).toLocaleDateString("fr") : ""}`);
      setTimeout(() => window.location.href = "/", 1500);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Erreur", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 mx-auto mb-4">
            <Key className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Licence requise</h1>
          <p className="text-sm text-gray-500 mt-2">
            Votre période d&apos;essai est terminée. Entrez votre clé de licence pour continuer.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <Input
              label="Clé de licence"
              value={licenceKey}
              onChange={(e) => setLicenceKey(e.target.value.toUpperCase())}
              placeholder="BAY-P-XXXX-XXXX-XXXX"
              className="font-mono text-center text-lg tracking-wider"
            />
            <Button className="w-full" onClick={handleActivate} disabled={loading}>
              {loading ? "Activation..." : "Activer"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Besoin d&apos;une licence ?</p>
                <p>Contactez-nous pour obtenir votre clé :</p>
                <div className="mt-2 space-y-1">
                  <p>📱 +221 77 662 14 10</p>
                  <p>💬 <a href="https://wa.me/221708372127" className="text-primary-600 hover:underline">+221 70 837 21 27 (WhatsApp)</a></p>
                  <p>📧 <a href="mailto:layedevops@gmail.com" className="text-primary-600 hover:underline">layedevops@gmail.com</a></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
