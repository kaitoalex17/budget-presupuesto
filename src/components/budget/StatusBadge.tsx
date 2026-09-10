import React from "react";
import { BudgetStatus } from "@/types";

export function StatusBadge({ status }: { status: BudgetStatus | string }) {
  const map: Record<string, { label: string; className: string }> = {
    BORRADOR: {
      label: "Borrador",
      className:
        "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    },
    ENVIADO: {
      label: "Enviado",
      className:
        "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    },
    VISTO: {
      label: "Visto por Cliente",
      className:
        "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    },
    ACEPTADO: {
      label: "Aceptado / Firmado",
      className:
        "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
    RECHAZADO: {
      label: "Rechazado",
      className:
        "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    },
    FACTURADO: {
      label: "Facturado",
      className:
        "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    },
  };

  const current = map[status] || {
    label: status,
    className: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${current.className}`}
    >
      {current.label}
    </span>
  );
}
