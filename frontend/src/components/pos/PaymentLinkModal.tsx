"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { X, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { formatCFA } from "@/lib/format";
import api from "@/lib/api";
import { showToast } from "@/components/ui/Toast";

interface PaymentLinkModalProps {
  amount: number;
  method: "wave" | "orange_money";
  customerPhone?: string;
  orderId?: string;
  onClose: () => void;
}

export default function PaymentLinkModal({ amount, method, customerPhone, orderId, onClose }: PaymentLinkModalProps) {
  const [link, setLink] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const endpoint = method === "wave" ? "/sales/payment-link/wave" : "/sales/payment-link/orange-money";
    api.post(endpoint, { amount, phone: customerPhone || "", order_id: orderId })
      .then((res) => {
        setLink(res.data.payment_url);
        setQrUrl(res.data.qr_url || null);
        if (res.data.message) showToast(res.data.message, "warning");
      })
      .catch(() => showToast("Erreur de génération du lien", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      showToast("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const methodLabel = method === "wave" ? "Wave" : "Orange Money";
  const methodColor = method === "wave" ? "blue" : "orange";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg bg-${methodColor}-100 flex items-center justify-center`}>
              <span className={`text-${methodColor}-600 font-bold text-sm`}>{method === "wave" ? "W" : "OM"}</span>
            </div>
            <h2 className="text-lg font-semibold">Paiement {methodLabel}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 text-center">
          {loading ? (
            <div className="py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto" />
              <p className="text-sm text-gray-500 mt-3">Génération du lien...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Montant à payer</p>
                <p className="text-3xl font-bold text-gray-900">{formatCFA(amount)}</p>
              </div>

              {qrUrl && (
                <div className="flex justify-center">
                  <div className="rounded-xl border-2 border-gray-200 p-2 bg-white">
                    <img src={qrUrl} alt="QR Code" className="h-48 w-48" />
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                {link ? "Scannez le QR code ou partagez le lien" : "Lien de paiement généré"}
              </p>

              {link && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <input
                    type="text"
                    value={link}
                    readOnly
                    className="flex-1 text-xs text-gray-600 bg-transparent outline-none truncate"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 p-1.5 rounded-lg bg-primary-100 hover:bg-primary-200 transition-colors"
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-primary-600" />}
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={onClose}>
                  Fermer
                </Button>
                {link && (
                  <Button className="flex-1" onClick={() => window.open(link, "_blank")}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
