"use client";

import React from "react";
import { MessageSquareShare } from "lucide-react";

interface WhatsAppShareProps {
  budgetNumber: string;
  clientName?: string | null;
  clientPhone?: string | null;
  total: number;
  publicToken: string;
  companyName?: string | null;
  className?: string;
  compact?: boolean;
}

export function WhatsAppShareButton({
  budgetNumber,
  clientName,
  clientPhone,
  total,
  publicToken,
  companyName,
  className = "",
  compact = false,
}: WhatsAppShareProps) {
  const handleShare = () => {
    const origin = window.location.origin;
    const publicUrl = `${origin}/p/${publicToken}`;

    const text = encodeURIComponent(
      `Hola ${clientName || ""},\n\nLe enviamos el presupuesto *${budgetNumber}* emitido por *${
        companyName || "nuestra empresa"
      }* por un importe de *${total.toFixed(2)} €*.\n\nPuede revisarlo, añadir comentarios y firmarlo cómodamente en línea desde este enlace:\n${publicUrl}\n\nQuedamos a su entera disposición.`
    );

    // Limpiar número de teléfono si existe (solo dígitos)
    const cleanPhone = clientPhone ? clientPhone.replace(/\D/g, "") : "";

    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;

    window.open(waUrl, "_blank");
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center justify-center gap-1.5 font-medium rounded-xl text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer ${
        compact ? "p-2 text-xs" : "px-3 py-2 text-xs"
      } ${className}`}
      title="Compartir presupuesto por WhatsApp"
      aria-label="Compartir por WhatsApp"
    >
      <MessageSquareShare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      {!compact && <span>WhatsApp</span>}
    </button>
  );
}
