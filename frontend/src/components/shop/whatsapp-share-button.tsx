"use client";

import { useRef } from "react";
import { MessageCircle } from "lucide-react";
import { formatCFA } from "@/lib/format";

export function WhatsAppShareButton({
  productName,
  productPrice,
  productId,
  storeWhatsapp,
  storeName,
}: {
  productName: string;
  productPrice: number;
  productId: string;
  storeWhatsapp: string | null;
  storeName: string;
}) {
  const openedRef = useRef(false);

  const handleShare = () => {
    if (openedRef.current) return;
    openedRef.current = true;
    const url = `${window.location.origin}/shop/${window.location.pathname.split("/")[2]}/product/${productId}`;
    const price = formatCFA(productPrice);
    const text = `Hey, regarde \u00e7a : ${productName} \u2014 ${price} chez ${storeName}\n${url}`;
    const waNumber = storeWhatsapp ? storeWhatsapp.replace(/\D/g, "") : "";
    const waUrl = waNumber
      ? `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => {
      openedRef.current = false;
    }, 1000);
  };

  return (
    <button
      onClick={handleShare}
      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-all border border-[#25D366]/20 bg-[#25D366]/5 hover:bg-[#25D366]/10 text-[#25D366]"
    >
      <MessageCircle className="w-4 h-4" />
      Partager sur WhatsApp
    </button>
  );
}
