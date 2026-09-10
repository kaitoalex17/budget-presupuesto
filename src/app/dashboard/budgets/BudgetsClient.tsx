"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/budget/StatusBadge";
import { WhatsAppShareButton } from "@/components/budget/WhatsAppShareButton";
import {
  Plus,
  Search,
  Copy,
  Check,
  Eye,
  Download,
  Edit2,
  Trash2,
  Receipt,
  FileText,
  Clock,
  Filter,
} from "lucide-react";

interface BudgetWithDetails {
  id: string;
  budgetNumber: string;
  title: string;
  issueDate: Date | string;
  validUntil: Date | string;
  status: string;
  total: number;
  publicToken: string;
  clientNotes: string | null;
  client?: {
    id: string;
    name: string;
    company: string | null;
    phone: string | null;
  } | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
  } | null;
}

export function BudgetsClient({
  initialBudgets,
  companyName,
  credits,
  isFlatRate,
}: {
  initialBudgets: BudgetWithDetails[];
  companyName?: string | null;
  credits: number;
  isFlatRate: boolean;
}) {
  const [budgets, setBudgets] = useState<BudgetWithDetails[]>(initialBudgets);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const copyPublicLink = (token: string, id: string) => {
    const url = `${window.location.origin}/p/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleConvertToInvoice = async (budget: BudgetWithDetails) => {
    if (
      !confirm(
        `¿Deseas convertir el presupuesto ${budget.budgetNumber} en factura oficial correlativa?`
      )
    ) {
      return;
    }

    setConvertingId(budget.id);
    try {
      const res = await fetch(`/api/budgets/${budget.id}/convert-to-invoice`, {
        method: "POST",
      });

      if (res.ok) {
        const invoice = await res.json();
        setBudgets(
          budgets.map((b) =>
            b.id === budget.id
              ? { ...b, status: "FACTURADO", invoice: { id: invoice.id, invoiceNumber: invoice.invoiceNumber } }
              : b
          )
        );
        alert(`¡Factura generada con éxito: ${invoice.invoiceNumber}! Puedes verla en el módulo de Facturación.`);
      } else {
        const err = await res.json();
        alert(err.error || "Error al convertir a factura");
      }
    } finally {
      setConvertingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este presupuesto?")) return;

    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBudgets(budgets.filter((b) => b.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = budgets.filter((b) => {
    const matchesStatus = selectedStatus === "ALL" || b.status === selectedStatus;
    const matchesSearch =
      b.budgetNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.client?.name && b.client.name.toLowerCase().includes(search.toLowerCase())) ||
      (b.client?.company && b.client.company.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const statuses = [
    { key: "ALL", label: "Todos" },
    { key: "BORRADOR", label: "Borradores" },
    { key: "ENVIADO", label: "Enviados" },
    { key: "VISTO", label: "Vistos" },
    { key: "ACEPTADO", label: "Aceptados" },
    { key: "FACTURADO", label: "Facturados" },
    { key: "RECHAZADO", label: "Rechazados" },
  ];

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Gestión de Presupuestos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Crea, comparte por WhatsApp, recoge firmas en línea y convierte en facturas
          </p>
        </div>

        <Link
          href="/dashboard/budgets/new"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Presupuesto</span>
        </Link>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por Nº de presupuesto, proyecto o cliente..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Pestañas de estado horizontales scrollables */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {statuses.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSelectedStatus(s.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedStatus === s.key
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-500/20"
                  : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Presupuestos */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-10 text-center">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
            No se encontraron presupuestos
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Prueba a cambiar el filtro de estado o crea un nuevo presupuesto.
          </p>
          <Link
            href="/dashboard/budgets/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Presupuesto</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              {/* Información Principal */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-sm text-brand-600 dark:text-brand-400 font-mono">
                    {b.budgetNumber}
                  </span>
                  <StatusBadge status={b.status} />

                  {/* Si el cliente dejó notas o dudas */}
                  {b.clientNotes && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      💬 Comentario del cliente
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {b.title}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Cliente: {b.client?.company || b.client?.name || "Sin cliente asignado"}
                  </span>
                  <span>•</span>
                  <span>Emisión: {new Date(b.issueDate).toLocaleDateString("es-ES")}</span>
                  <span>•</span>
                  <span>Validez: {new Date(b.validUntil).toLocaleDateString("es-ES")}</span>
                </div>

                {/* Comentario del cliente si existe */}
                {b.clientNotes && (
                  <div className="mt-2 p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-300">
                    <strong>Nota del cliente:</strong> &quot;{b.clientNotes}&quot;
                  </div>
                )}
              </div>

              {/* Total y Botones de Acción */}
              <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                {/* Importe */}
                <div className="text-left md:text-right pr-2">
                  <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-mono block">
                    {b.total.toFixed(2)} €
                  </span>
                  <span className="text-[10px] text-slate-400 block">Total con impuestos</span>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* WhatsApp */}
                  <WhatsAppShareButton
                    budgetNumber={b.budgetNumber}
                    clientName={b.client?.name}
                    clientPhone={b.client?.phone}
                    total={b.total}
                    publicToken={b.publicToken}
                    companyName={companyName}
                    compact
                  />

                  {/* Copiar enlace público */}
                  <button
                    type="button"
                    onClick={() => copyPublicLink(b.publicToken, b.id)}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Copiar enlace para el cliente"
                  >
                    {copiedId === b.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {/* Ver vista pública y firma */}
                  <a
                    href={`/p/${b.publicToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Abrir vista de firma online"
                  >
                    <Eye className="w-4 h-4" />
                  </a>

                  {/* Descargar PDF */}
                  <a
                    href={`/api/budgets/${b.id}/pdf`}
                    download={`${b.budgetNumber}.pdf`}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Descargar presupuesto en PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  {/* Convertir a Factura si está aceptado */}
                  {(b.status === "ACEPTADO" || b.status === "FACTURADO") && (
                    <button
                      type="button"
                      disabled={b.status === "FACTURADO" || convertingId === b.id}
                      onClick={() => handleConvertToInvoice(b)}
                      className={`p-2 rounded-xl text-xs font-semibold transition-colors ${
                        b.status === "FACTURADO"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 opacity-60 cursor-not-allowed"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                      title={
                        b.status === "FACTURADO"
                          ? `Facturado: ${b.invoice?.invoiceNumber || ""}`
                          : "Convertir en Factura Oficial"
                      }
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  )}

                  {/* Editar */}
                  <Link
                    href={`/dashboard/budgets/${b.id}/edit`}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Editar presupuesto"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>

                  {/* Eliminar */}
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
