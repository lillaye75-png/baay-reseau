"use client";

import { useParams } from "next/navigation";
import { CartProvider } from "@/lib/cart-context";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = (params?.slug || "default") as string;
  return <CartProvider slug={slug}>{children}</CartProvider>;
}
