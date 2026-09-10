import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { StatusBadge } from "@/components/budget/StatusBadge";
import { WhatsAppShareButton } from "@/components/budget/WhatsAppShareButton";
import {
  ArrowLeft,
  Phone,
  Mail,
  Building,
  MapPin,
  FileText,
  Plus,
  Eye,
  Download,
  Calendar,
  CreditCard,
} from "lucide-react";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  const client = await prisma.client.findFirst({
    where: { id, userId: user.userId },
    include: {
      budgets: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const totalBudgets = client.budgets.length;
  const acceptedBudgets = client.budgets.filter(
    (b) => b.status === "ACEPTADO" || b.status === "FACTURADO"
  );
  const totalVolume = client.budgets.reduce((acc, b) => acc + b.total, 0);
  const acceptedVolume = acceptedBudgets.reduce((acc, b) => acc + b.total, 0);
  const conversionRate = totalBudgets > 0 ? (acceptedBudgets.length / totalBudgets) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Botón Volver y Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/clients"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {client.company || client.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ficha de contacto y seguimiento de presupuestos
            </p>
          </div>
        </div>

        <Link
          href={`/dashboard/budgets/new?clientId=${client.id}`}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Presupuesto</span>
        </Link>
      </div>

      {/* Grid: Tarjeta de Datos y Tarjeta de Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Datos de Contacto */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Información del Cliente
          </h2>

          <div className="space-y-2.5 text-sm">
            {client.company && (
              <div>
                <span className="block text-xs text-slate-400">Contacto principal:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {client.name}
                </span>
              </div>
            )}

            {client.nif && (
              <div>
                <span className="block text-xs text-slate-400">NIF / CIF:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {client.nif}
                </span>
              </div>
            )}

            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <a
                  href={`tel:${client.phone}`}
                  className="text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {client.phone}
                </a>
              </div>
            )}

            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a
                  href={`mailto:${client.email}`}
                  className="text-brand-600 dark:text-brand-400 hover:underline truncate"
                >
                  {client.email}
                </a>
              </div>
            )}

            {client.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-slate-600 dark:text-slate-300">{client.address}</span>
              </div>
            )}

            {client.notes && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-xs font-semibold text-slate-500 mb-1">
                  Notas de seguimiento:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                  {client.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Métricas con este Cliente */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Presupuestos Emitidos</span>
            <div className="mt-4">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalBudgets}
              </span>
              <p className="text-xs text-slate-500 mt-1">{totalVolume.toFixed(2)} € en ofertas</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Presupuestos Aceptados</span>
            <div className="mt-4">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {acceptedBudgets.length}
              </span>
              <p className="text-xs text-slate-500 mt-1">{acceptedVolume.toFixed(2)} € confirmados</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Tasa de Aceptación</span>
            <div className="mt-4">
              <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                {conversionRate.toFixed(0)}%
              </span>
              <p className="text-xs text-slate-500 mt-1">Efectividad con este contacto</p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Presupuestos para este Cliente */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Historial de Presupuestos del Cliente
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Todos los presupuestos generados, estados de firma y opciones de descarga
          </p>
        </div>

        {client.budgets.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Aún no hay presupuestos para este cliente
            </p>
            <Link
              href={`/dashboard/budgets/new?clientId=${client.id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 mt-3 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear primer presupuesto</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {client.budgets.map((b) => (
              <div
                key={b.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-brand-600 dark:text-brand-400">
                      {b.budgetNumber}
                    </span>
                    <StatusBadge status={b.status} />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                    {b.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(b.issueDate).toLocaleDateString("es-ES")} · Validez hasta:{" "}
                      {new Date(b.validUntil).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {b.total.toFixed(2)} €
                  </span>

                  <div className="flex items-center gap-1.5">
                    <WhatsAppShareButton
                      budgetNumber={b.budgetNumber}
                      clientName={client.name}
                      clientPhone={client.phone}
                      total={b.total}
                      publicToken={b.publicToken}
                      companyName={user.companyName}
                      compact
                    />

                    <a
                      href={`/p/${b.publicToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                      title="Ver y firmar"
                    >
                      <Eye className="w-4 h-4" />
                    </a>

                    <a
                      href={`/api/budgets/${b.id}/pdf`}
                      download={`${b.budgetNumber}.pdf`}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                      title="Descargar PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
