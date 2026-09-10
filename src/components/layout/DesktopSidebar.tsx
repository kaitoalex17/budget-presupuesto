"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  BookmarkCheck,
  Receipt,
  Settings,
  Shield,
  PlusCircle,
} from "lucide-react";

export function DesktopSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/budgets", label: "Presupuestos", icon: FileText },
    { href: "/dashboard/clients", label: "Clientes", icon: Users },
    { href: "/dashboard/concepts", label: "Catálogo de Conceptos", icon: BookmarkCheck },
    { href: "/dashboard/invoices", label: "Facturación & Gestoría", icon: Receipt },
    { href: "/dashboard/settings", label: "Ajustes y Perfil", icon: Settings },
  ];

  if (role === "ADMIN") {
    links.push({
      href: "/admin/users",
      label: "Gestión SaaS (Admin)",
      icon: Shield,
    });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Brand */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-500/30">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
            Presupuestos Pro
          </span>
          <span className="text-[10px] uppercase tracking-wider text-brand-600 dark:text-brand-400 font-semibold">
            SaaS Edition
          </span>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="p-4">
        <Link
          href="/dashboard/budgets/new"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-sm shadow-brand-500/20 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo Presupuesto</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-400"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-400 text-center">
        v1.0.0 · Listo para Portainer
      </div>
    </aside>
  );
}
