"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AuthSession } from "@/types";
import { LogOut, Coins, Sparkles, Shield, User } from "lucide-react";

export function TopNavbar({ user }: { user: AuthSession }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Título o Nombre de la Empresa */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-bold text-base text-slate-900 dark:text-white leading-tight">
            {user.companyName || user.name}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {user.role === "ADMIN" ? "Administrador del Sistema" : user.name}
          </span>
        </div>
      </div>

      {/* Controles del lado derecho */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Indicador de Créditos / Tarifa Plana */}
        {user.isFlatRate ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tarifa Plana</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{user.credits} Créditos</span>
          </div>
        )}

        {/* Acceso a Admin si es administrador */}
        {user.role === "ADMIN" && (
          <a
            href="/admin/users"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Portal Admin</span>
          </a>
        )}

        {/* Toggle Modo Oscuro / Claro */}
        <ThemeToggle />

        {/* Botón Cerrar Sesión */}
        <button
          onClick={handleLogout}
          type="button"
          className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
