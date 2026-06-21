import { showToast } from "@/components/ui/Toast";
import * as XLSX from "xlsx";

export function exportToXLSX(data: Record<string, any>[], filename: string, columns?: { key: string; label: string }[]) {
  if (data.length === 0) {
    showToast("Aucune donnée à exporter", "warning");
    return;
  }

  const cols = columns || Object.keys(data[0]).map((k) => ({ key: k, label: k }));
  const headerRow = cols.map((c) => c.label);
  const rows = data.map((row) =>
    cols.map((c) => {
      const val = row[c.key];
      return val === null || val === undefined ? "" : val;
    })
  );

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...rows]);
  ws["!cols"] = cols.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Données");
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  showToast(`${filename} exporté !`);
}

export function exportProducts(products: any[]) {
  exportToXLSX(
    products.map((p) => ({
      name: p.name,
      sku: p.sku || "",
      barcode: p.barcode || "",
      category: (p as any).category_name || "",
      price_cfa: p.price_cfa,
      cost_price_cfa: p.cost_price_cfa,
      stock: p.stock_quantity,
      threshold: p.low_stock_threshold,
      unit: p.unit || "piece",
      image_url: p.image_url || "",
      description: (p as any).description || "",
    })),
    "produits",
    [
      { key: "name", label: "Nom du produit" },
      { key: "sku", label: "SKU" },
      { key: "barcode", label: "Code-barres" },
      { key: "category", label: "Catégorie" },
      { key: "price_cfa", label: "Prix de vente (CFA)" },
      { key: "cost_price_cfa", label: "Prix d'achat (CFA)" },
      { key: "stock", label: "Stock" },
      { key: "threshold", label: "Seuil stock bas" },
      { key: "unit", label: "Unité" },
      { key: "image_url", label: "Images du produit" },
      { key: "description", label: "Description" },
    ]
  );
}

export function exportCustomers(customers: any[]) {
  exportToXLSX(
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
  exportToXLSX(
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
