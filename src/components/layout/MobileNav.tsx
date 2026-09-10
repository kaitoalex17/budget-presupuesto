"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Plus, Users, Settings } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/budgets", label: "Presupuestos", icon: FileText },
    { href: "/dashboard/clients", label: "Clientes", icon: Users },
    { href: "/dashboard/settings", label: "Ajustes", icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 pb-safe">
      <div className="flex items-center justify-around h-16 px-2 relative">
        {/* Enlaces a la izquierda del botón + */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            pathname === "/dashboard"
              ? "text-brand-600 dark:text-brand-400 font-semibold"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Inicio</span>
        </Link>

        <Link
          href="/dashboard/budgets"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            pathname.startsWith("/dashboard/budgets") && pathname !== "/dashboard/budgets/new"
              ? "text-brand-600 dark:text-brand-400 font-semibold"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Presupuestos</span>
        </Link>

        {/* Botón Central Flotante de Nuevo Presupuesto (+) */}
        <div className="flex items-center justify-center flex-1 -mt-5">
          <Link
            href="/dashboard/budgets/new"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-600 text-white shadow-lg shadow-brand-500/40 hover:bg-brand-700 active:scale-95 transition-all"
            aria-label="Crear nuevo presupuesto"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </Link>
        </div>

        <Link
          href="/dashboard/clients"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            pathname.startsWith("/dashboard/clients")
              ? "text-brand-600 dark:text-brand-400 font-semibold"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Clientes</span>
        </Link>

        <Link
          href="/dashboard/settings"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            pathname.startsWith("/dashboard/settings")
              ? "text-brand-600 dark:text-brand-400 font-semibold"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Ajustes</span>
        </Link>
      </div>
    </nav>
  );
}
