"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Smartphone, ArrowRight, Store, AlertTriangle } from "lucide-react";

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "1";
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expired) setError("Votre licence a expiré. Contactez l'administrateur.");
  }, [expired]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(phone, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Numéro ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Store className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Naatal ERP Cloud</h1>
              <p className="text-primary-200">ERP Boutique</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Gérez votre boutique en toute simplicité
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Inventaire, ventes, crédits et paiements mobiles — tout dans une seule application, optimisée pour les commerçants du Sénégal.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">WhatsApp AI Assistant</p>
                <p className="text-sm text-primary-200">Gérez vos ventes par message</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-lg font-bold">CFA</span>
              </div>
              <div>
                <p className="font-medium">Paiements Mobiles</p>
                <p className="text-sm text-primary-200">Wave & Orange Money intégrés</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-8 bg-white lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white font-bold">
              BR
            </div>
            <span className="text-xl font-bold text-gray-900">Naatal ERP Cloud</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Bienvenue</h2>
          <p className="text-gray-500 mb-8">Connectez-vous à votre boutique</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className={`rounded-lg p-3 text-sm flex items-center gap-2 ${expired ? "bg-orange-50 border border-orange-200 text-orange-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Input
              label="Numéro de téléphone"
              type="tel"
              placeholder="+221 77 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connexion...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Se connecter
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Pas encore de compte ?{" "}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-700">
              Créer un compte
            </Link>
          </p>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-400">ou</span>
            </div>
          </div>

          <button
            onClick={() => {
              const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
              if (!clientId) {
                setError("Google login non configuré");
                return;
              }
              const redirectUri = `${window.location.origin}/auth/callback`;
              const scope = "email profile";
              const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&prompt=select_account`;
              window.location.href = url;
            }}
            className="mt-4 w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Se connecter avec Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}
