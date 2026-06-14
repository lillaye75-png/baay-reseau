"use client";

import { formatCFA, formatDateTime } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import api, { Tenant } from "@/lib/api";
import { Printer, Download } from "lucide-react";

interface InvoiceItem {
  product_name: string;
  quantity: number;
  unit_price_cfa: number;
  total_cfa: number;
}

interface InvoiceProps {
  saleId: string;
  items: InvoiceItem[];
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  showActions?: boolean;
  onDelete?: () => void;
}

export default function A4Invoice({ saleId, items, total, paymentMethod, customerName, customerPhone, createdAt, showActions = true, onDelete }: InvoiceProps) {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    api.get("/tenants/me").then((res) => setTenant(res.data)).catch(() => {});
  }, []);

  const paymentLabels: Record<string, string> = {
    cash: "Espèces",
    wave: "Wave",
    orange_money: "Orange Money",
    credit: "Crédit",
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const el = document.getElementById("a4-invoice");
    if (!el) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Facture ${saleId.slice(0, 8)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
        .header-left h1 { margin: 0; font-size: 24px; }
        .header-left p { margin: 2px 0; color: #666; font-size: 13px; }
        .header-right { text-align: right; }
        .header-right h2 { margin: 0; color: #ea580c; font-size: 20px; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .meta-box { background: #f9fafb; padding: 12px; border-radius: 8px; flex: 1; margin: 0 5px; }
        .meta-box:first-child { margin-left: 0; }
        .meta-box:last-child { margin-right: 0; }
        .meta-box h4 { margin: 0 0 5px; font-size: 12px; color: #666; text-transform: uppercase; }
        .meta-box p { margin: 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f3f4f6; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e5e7eb; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
        .text-right { text-align: right; }
        .totals { display: flex; justify-content: flex-end; }
        .totals-box { width: 250px; }
        .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
        .totals-total { border-top: 2px solid #333; padding-top: 8px; font-size: 18px; font-weight: bold; }
        .footer { border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        @media print { body { padding: 0; } }
      </style></head><body>${el.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const subtotal = items.reduce((s, i) => s + i.total_cfa, 0);

  return (
    <>
      <div id="a4-invoice" className="bg-white max-w-[210mm] mx-auto" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <div className="flex justify-between border-b-2 border-gray-900 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tenant?.name || "Naatal ERP Cloud"}</h1>
            <p className="text-sm text-gray-500">{tenant?.phone || ""}</p>
            {tenant?.email && <p className="text-sm text-gray-500">{tenant.email}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-primary-600">FACTURE</h2>
            <p className="text-sm text-gray-500">N° {saleId.slice(0, 8).toUpperCase()}</p>
            <p className="text-sm text-gray-500">{formatDateTime(createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Facturé à</h4>
            <p className="font-medium">{customerName || "Client de passage"}</p>
            {customerPhone && <p className="text-sm text-gray-500">{customerPhone}</p>}
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Paiement</h4>
            <p className="font-medium">{paymentLabels[paymentMethod] || paymentMethod}</p>
            <p className="text-sm text-gray-500">Date: {formatDateTime(createdAt)}</p>
          </div>
        </div>

        <table className="w-full mb-6">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Article</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Qté</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Prix unitaire</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="px-4 py-3 text-sm font-medium">{item.product_name}</td>
                <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                <td className="px-4 py-3 text-sm text-right">{formatCFA(item.unit_price_cfa)}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">{formatCFA(item.total_cfa)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-500">Sous-total</span>
              <span>{formatCFA(subtotal)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold py-2 border-t-2 border-gray-900 mt-2">
              <span>TOTAL</span>
              <span className="text-primary-600">{formatCFA(total)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-8 text-center text-xs text-gray-400">
          <p>Mèrsi, dëgg na tànggi! — {tenant?.name || "Naatal ERP Cloud"}</p>
          <p className="mt-1">Naatal ERP Cloud — ERP Boutique Sénégal</p>
        </div>
      </div>

      {showActions && (
        <div className="print:hidden flex justify-center gap-3 mt-4">
          <button
            onClick={handlePrint}
            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimer A4
          </button>
          <button
            onClick={handleDownload}
            className="rounded-lg bg-gray-100 border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
            >
              Annuler la facture
            </button>
          )}
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #a4-invoice, #a4-invoice * { visibility: visible; }
          #a4-invoice { position: absolute; left: 0; top: 0; width: 210mm; padding: 20mm; }
        }
      `}</style>
    </>
  );
}
