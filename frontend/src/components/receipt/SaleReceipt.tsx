"use client";

import { formatCFA, formatDateTime } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import api, { Tenant } from "@/lib/api";
import { generateESCPOS } from "@/lib/escpos";
import { Printer, Bluetooth } from "lucide-react";
import BluetoothPrinter from "@/components/pos/BluetoothPrinter";
import { showToast } from "@/components/ui/Toast";

interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price_cfa: number;
  total_cfa: number;
}

interface ReceiptProps {
  saleId: string;
  items: ReceiptItem[];
  total: number;
  paymentMethod: string;
  customerName?: string;
  createdAt: string;
}

export default function SaleReceipt({ saleId, items, total, paymentMethod, customerName, createdAt }: ReceiptProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [showBluetooth, setShowBluetooth] = useState(false);
  const [bluetoothPrinter, setBluetoothPrinter] = useState<any>(null);

  useEffect(() => {
    api.get("/tenants/me").then((res) => setTenant(res.data)).catch(() => {});
  }, []);

  const paymentLabels: Record<string, string> = {
    cash: t("cash"),
    wave: "Wave",
    orange_money: "Orange Money",
    credit: t("credit"),
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBluetoothPrint = async () => {
    if (!bluetoothPrinter) {
      setShowBluetooth(true);
      return;
    }

    try {
      const escpos = generateESCPOS({
        shopName: tenant?.name || "Naatal ERP Cloud",
        shopPhone: tenant?.phone || "",
        saleId,
        date: formatDateTime(createdAt),
        customerName,
        paymentMethod,
        items,
        total,
      });

      await bluetoothPrinter.characteristic.writeValue(escpos);
      showToast("Ticket imprimé !");
    } catch (err) {
      showToast("Erreur d'impression", "error");
      setBluetoothPrinter(null);
      setShowBluetooth(true);
    }
  };

  const handleBluetoothConnect = (printer: any) => {
    setBluetoothPrinter(printer);
    setShowBluetooth(false);
  };

  return (
    <>
      <div id="receipt-content" className="bg-white p-6 max-w-sm mx-auto font-mono text-sm" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
          <h1 className="text-lg font-bold">{tenant?.name || "Naatal ERP Cloud"}</h1>
          <p className="text-xs text-gray-500">{tenant?.phone || ""}</p>
          <p className="text-xs text-gray-400 mt-1">— {t("receipt")} —</p>
        </div>

        <div className="space-y-1 text-xs text-gray-600 mb-3">
          <div className="flex justify-between">
            <span>{t("date")}:</span>
            <span>{formatDateTime(createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("sale")} #:</span>
            <span>{saleId.slice(0, 8).toUpperCase()}</span>
          </div>
          {customerName && (
            <div className="flex justify-between">
              <span>{t("client")}:</span>
              <span>{customerName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>{t("payment")}:</span>
            <span>{paymentLabels[paymentMethod] || paymentMethod}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-300 pt-3 mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{t("product")}</span>
            <span>{t("total")}</span>
          </div>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between py-1">
              <span className="flex-1">
                {item.name} <span className="text-gray-400">×{item.quantity}</span>
              </span>
              <span className="text-right ml-2">{formatCFA(item.total_cfa)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-300 pt-3">
          <div className="flex justify-between font-bold text-base">
            <span>{t("total").toUpperCase()}</span>
            <span>{formatCFA(total)}</span>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 mt-6 border-t border-dashed border-gray-300 pt-4">
          <p>Mèrsi, dëgg na tànggi!</p>
          <p className="mt-1">Naatal ERP Cloud — ERP Boutique</p>
        </div>
      </div>

      <div className="print:hidden flex justify-center gap-3 mt-4">
        <button
          onClick={handlePrint}
          className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          Imprimer le ticket
        </button>
        <button
          onClick={handleBluetoothPrint}
          className="rounded-lg bg-gray-100 border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <Bluetooth className="h-4 w-4" />
          {bluetoothPrinter ? "Imprimer (Bluetooth)" : "Connecter imprimante"}
        </button>
      </div>

      {showBluetooth && (
        <BluetoothPrinter
          onConnect={handleBluetoothConnect}
          onClose={() => setShowBluetooth(false)}
        />
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content,
          #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
}
