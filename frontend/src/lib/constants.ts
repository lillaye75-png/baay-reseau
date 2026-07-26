export const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || "776621410";
export const CONTACT_WHATSAPP = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "708372127";
export const DEFAULT_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DEFAULT_ADMIN_PASSWORD || "admin123";
export const DEFAULT_TENANT_NAME = process.env.NEXT_PUBLIC_DEFAULT_TENANT_NAME || "My Shop";

export function formatPhoneSN(raw: string): string {
  if (raw.length === 9 && raw.startsWith("7")) {
    return `+221 ${raw.slice(0, 2)} ${raw.slice(2, 5)} ${raw.slice(5, 7)} ${raw.slice(7, 9)}`;
  }
  return `+221 ${raw}`;
}
