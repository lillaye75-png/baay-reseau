export function formatCFA(amount: number): string {
  return new Intl.NumberFormat("fr-SN", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " CFA";
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-SN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-SN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const API_URL = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname}:8000`)
  : "http://localhost:8000";

export function getImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: "Espèces",
    wave: "Wave",
    orange_money: "Orange Money",
    credit: "Crédit",
  };
  return labels[method] || method;
}

export function getPaymentMethodColor(method: string): string {
  const colors: Record<string, string> = {
    cash: "bg-green-100 text-green-800",
    wave: "bg-blue-100 text-blue-800",
    orange_money: "bg-orange-100 text-orange-800",
    credit: "bg-red-100 text-red-800",
  };
  return colors[method] || "bg-gray-100 text-gray-800";
}
