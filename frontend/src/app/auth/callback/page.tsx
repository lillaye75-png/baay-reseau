"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AuthCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const returnedError = urlParams.get("error");

    if (returnedError) {
      setError("Connexion Google annulée");
      return;
    }

    if (!code) {
      setError("Pas de code d'autorisation reçu");
      return;
    }

    const savedState = sessionStorage.getItem("oauth_state");
    if (savedState && state !== savedState) {
      setError("État OAuth invalide — potential attaque CSRF");
      return;
    }
    sessionStorage.removeItem("oauth_state");

    const redirectUri = `${window.location.origin}/auth/callback`;

    api.post("/auth/google", { code, redirect_uri: redirectUri })
      .then((res) => {
        const { access_token, refresh_token, user: userData } = res.data;
        localStorage.setItem("token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        localStorage.setItem("user", JSON.stringify(userData));

        api.get("/tenants/me").then((tenantRes) => {
          const needsWizard = !tenantRes.data.wizard_completed;
          window.location.href = needsWizard ? "/wizard" : "/dashboard";
        }).catch(() => {
          window.location.href = "/dashboard";
        });
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Erreur lors de la connexion Google");
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto mb-4" />
        <p className="text-gray-500">Connexion en cours...</p>
      </div>
    </div>
  );
}
