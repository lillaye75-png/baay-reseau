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
  sellerName?: string;
}

function InvoiceCopy({
  saleId,
  items,
  total,
  paymentMethod,
  customerName,
  customerPhone,
  createdAt,
  tenant,
  printSettings,
  copyLabel,
  sellerName,
}: {
  saleId: string;
  items: InvoiceItem[];
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  tenant: Tenant | null;
  printSettings: any;
  copyLabel: string;
  sellerName?: string;
}) {
  const paymentLabels: Record<string, string> = {
    cash: "Espèces",
    wave: "Wave",
    orange_money: "Orange Money",
    credit: "Crédit",
  };

  const subtotal = items.reduce((s, i) => s + i.total_cfa, 0);

  return (
    <div className="invoice-copy" style={{ fontSize: "10px", lineHeight: "1.3" }}>
      <div className="text-center mb-1" style={{ fontSize: "8px", color: "#999" }}>
        {copyLabel}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #000", paddingBottom: "4px", marginBottom: "4px" }}>
        <div>
          {printSettings?.print_logo_url && (
            <img src={printSettings.print_logo_url} alt="Logo" style={{ height: "28px", marginBottom: "2px" }} onError={(e) => (e.currentTarget.style.display = "none")} />
          )}
          <div style={{ fontSize: "9px", fontWeight: "bold" }}>
            {printSettings?.print_header_text || tenant?.name || "Naatal ERP Cloud"}
          </div>
          {tenant?.description && <div style={{ fontSize: "7px", color: "#666" }}>{tenant.description}</div>}
          <div style={{ fontSize: "7px", color: "#666" }}>
            {[tenant?.phone, tenant?.email, tenant?.address].filter(Boolean).join(" | ")}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", fontWeight: "bold", color: "#ea580c" }}>FACTURE</div>
          <div style={{ fontSize: "8px" }}>N° {saleId.slice(0, 8).toUpperCase()}</div>
          <div style={{ fontSize: "7px", color: "#666" }}>{formatDateTime(createdAt)}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
        <div style={{ flex: 1, background: "#f9fafb", padding: "3px 6px", borderRadius: "4px" }}>
          <div style={{ fontSize: "7px", color: "#666" }}>FACTURÉ À</div>
          <div style={{ fontSize: "9px", fontWeight: "bold" }}>{customerName || "Client de passage"}</div>
          {customerPhone && <div style={{ fontSize: "7px", color: "#666" }}>{customerPhone}</div>}
        </div>
        <div style={{ flex: 1, background: "#f9fafb", padding: "3px 6px", borderRadius: "4px" }}>
          <div style={{ fontSize: "7px", color: "#666" }}>PAIEMENT</div>
          <div style={{ fontSize: "9px" }}>{paymentLabels[paymentMethod] || paymentMethod}</div>
          {sellerName && <div style={{ fontSize: "7px", color: "#666" }}>Vendeur: {sellerName}</div>}
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4px", fontSize: "9px" }}>
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            <th style={{ padding: "3px 4px", textAlign: "left", fontSize: "7px", borderBottom: "1px solid #ccc" }}>Article</th>
            <th style={{ padding: "3px 4px", textAlign: "center", fontSize: "7px", borderBottom: "1px solid #ccc" }}>Qté</th>
            <th style={{ padding: "3px 4px", textAlign: "right", fontSize: "7px", borderBottom: "1px solid #ccc" }}>P.U.</th>
            <th style={{ padding: "3px 4px", textAlign: "right", fontSize: "7px", borderBottom: "1px solid #ccc" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "2px 4px", fontSize: "9px" }}>{item.product_name}</td>
              <td style={{ padding: "2px 4px", textAlign: "center", fontSize: "9px" }}>{item.quantity}</td>
              <td style={{ padding: "2px 4px", textAlign: "right", fontSize: "9px" }}>{formatCFA(item.unit_price_cfa)}</td>
              <td style={{ padding: "2px 4px", textAlign: "right", fontSize: "9px" }}>{formatCFA(item.total_cfa)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: "120px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px" }}>
            <span>Sous-total</span>
            <span>{formatCFA(subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "10px", borderTop: "1px solid #000", paddingTop: "2px", marginTop: "2px" }}>
            <span>TOTAL</span>
            <span style={{ color: "#ea580c" }}>{formatCFA(total)}</span>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #ccc", paddingTop: "3px", marginTop: "4px", textAlign: "center", fontSize: "7px", color: "#999" }}>
        {printSettings?.print_footer_text || "Merci, dëgg na tànggi!"} — {tenant?.name || "Naatal ERP Cloud"}
        <br />Naatal ERP Cloud — ERP Boutique Sénégal
      </div>
    </div>
  );
}

export default function A4Invoice({ saleId, items, total, paymentMethod, customerName, customerPhone, createdAt, showActions = true, onDelete, sellerName }: InvoiceProps) {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [printSettings, setPrintSettings] = useState<any>(null);

  useEffect(() => {
    api.get("/tenants/me").then((res) => {
      setTenant(res.data);
      api.get(`/tenants/${res.data.id}/print-settings`).then((r) => setPrintSettings(r.data)).catch(() => {});
    }).catch(() => {});
  }, []);

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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; }
        .page { width: 210mm; min-height: 297mm; padding: 8mm 10mm; page-break-after: always; }
        .copy-separator { border-top: 1px dashed #ccc; margin: 8mm 0; }
        .watermark { text-align: center; font-size: 7px; color: #999; margin: 6mm 0; }
        @media print { body { padding: 0; } .page { box-shadow: none; } }
      </style></head><body>${el.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <div id="a4-invoice" className="bg-white max-w-[210mm] mx-auto p-[8mm]" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <InvoiceCopy
          saleId={saleId}
          items={items}
          total={total}
          paymentMethod={paymentMethod}
          customerName={customerName}
          customerPhone={customerPhone}
          createdAt={createdAt}
          tenant={tenant}
          printSettings={printSettings}
          copyLabel="ORIGINAL"
          sellerName={sellerName}
        />

        <div className="copy-separator" style={{ borderTop: "1px dashed #ccc", margin: "6mm 0" }}>
          <div style={{ textAlign: "center", fontSize: "7px", color: "#999", margin: "3mm 0" }}>
            - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          </div>
        </div>

        <InvoiceCopy
          saleId={saleId}
          items={items}
          total={total}
          paymentMethod={paymentMethod}
          customerName={customerName}
          customerPhone={customerPhone}
          createdAt={createdAt}
          tenant={tenant}
          printSettings={printSettings}
          copyLabel="COPIE"
          sellerName={sellerName}
        />
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
          {isOwner && onDelete && (
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
          #a4-invoice { position: absolute; left: 0; top: 0; width: 210mm; padding: 8mm 10mm; }
        }
      `}</style>
    </>
  );
}
