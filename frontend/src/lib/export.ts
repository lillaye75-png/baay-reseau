import { showToast } from "@/components/ui/Toast";

export function exportToCSV(data: Record<string, any>[], filename: string, columns?: { key: string; label: string }[]) {
  if (data.length === 0) {
    showToast("Aucune donnée à exporter", "warning");
    return;
  }

  const cols = columns || Object.keys(data[0]).map((k) => ({ key: k, label: k }));
  const header = cols.map((c) => c.label).join(",");
  const rows = data.map((row) =>
    cols
      .map((c) => {
        const val = row[c.key];
        const str = val === null || val === undefined ? "" : String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(",")
  );

  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`${filename} exporté !`);
}

export function exportProducts(products: any[]) {
  exportToCSV(
    products.map((p) => ({
      name: p.name,
      sku: p.sku || "",
      price_cfa: p.price_cfa,
      cost_price_cfa: p.cost_price_cfa,
      stock: p.stock_quantity,
      threshold: p.low_stock_threshold,
      unit: p.unit,
      barcode: p.barcode || "",
    })),
    "produits",
    [
      { key: "name", label: "Nom" },
      { key: "sku", label: "SKU" },
      { key: "price_cfa", label: "Prix (CFA)" },
      { key: "cost_price_cfa", label: "Coût (CFA)" },
      { key: "stock", label: "Stock" },
      { key: "threshold", label: "Seuil" },
      { key: "unit", label: "Unité" },
      { key: "barcode", label: "Code-barres" },
    ]
  );
}

export function exportCustomers(customers: any[]) {
  exportToCSV(
    customers.map((c) => ({
      name: c.name,
      nickname: c.nickname || "",
      phone: c.phone || "",
      whatsapp: c.whatsapp_number || "",
      credit_cfa: c.total_credit_cfa,
      notes: c.notes || "",
    })),
    "clients",
    [
      { key: "name", label: "Nom" },
      { key: "nickname", label: "Surnom" },
      { key: "phone", label: "Téléphone" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "credit_cfa", label: "Crédit (CFA)" },
      { key: "notes", label: "Notes" },
    ]
  );
}

export function exportSales(sales: any[]) {
  exportToCSV(
    sales.map((s) => ({
      date: s.created_at,
      id: s.id.slice(0, 8),
      total_cfa: s.total_cfa,
      payment_method: s.payment_method,
      is_credit: s.is_credit ? "Oui" : "Non",
      items_count: s.items?.length || 0,
    })),
    "ventes",
    [
      { key: "date", label: "Date" },
      { key: "id", label: "Vente #" },
      { key: "total_cfa", label: "Total (CFA)" },
      { key: "payment_method", label: "Paiement" },
      { key: "is_credit", label: "Crédit" },
      { key: "items_count", label: "Articles" },
    ]
  );
}
