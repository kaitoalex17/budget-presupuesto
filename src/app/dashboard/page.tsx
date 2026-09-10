import React from "react";
import Link from "next/link";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { StatusBadge } from "@/components/budget/StatusBadge";
import { WhatsAppShareButton } from "@/components/budget/WhatsAppShareButton";
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Coins,
  Plus,
  ArrowRight,
  FileText,
  Users,
  Eye,
  Download,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // 1. Obtener todos los presupuestos del usuario para estadísticas
  const budgets = await prisma.budget.findMany({
    where: { userId: user.userId },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  const totalCount = budgets.length;
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.total, 0);

  const acceptedBudgets = budgets.filter(
    (b) => b.status === "ACEPTADO" || b.status === "FACTURADO"
  );
  const totalAccepted = acceptedBudgets.reduce((sum, b) => sum + b.total, 0);

  const pendingBudgets = budgets.filter(
    (b) => b.status === "ENVIADO" || b.status === "VISTO" || b.status === "BORRADOR"
  );
  const totalPending = pendingBudgets.reduce((sum, b) => sum + b.total, 0);

  const conversionRate = totalCount > 0 ? (acceptedBudgets.length / totalCount) * 100 : 0;

  // Presupuestos recientes (primeros 5)
  const recentBudgets = budgets.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Alerta de Créditos Bajos si no tiene tarifa plana */}
      {!user.isFlatRate && user.credits <= 2 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Coins className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                ¡Te quedan {user.credits} crédito{user.credits === 1 ? "" : "s"} para crear presupuestos!
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Contacta con el administrador del SaaS para realizar una recarga de puntos o activar una tarifa plana.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Encabezado y Acciones Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Panel de Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Seguimiento de actividad comercial, presupuestos y conversiones
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/budgets/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 shadow-sm shadow-brand-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Presupuesto</span>
          </Link>
        </div>
      </div>

      {/* Métricas Principales (Grid Responsivo) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Presupuestado */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Presupuestado
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {totalBudgeted.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">{totalCount} presupuestos emitidos</p>
          </div>
        </div>

        {/* Total Aceptado */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Aceptado
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalAccepted.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">{acceptedBudgets.length} aprobados / firmados</p>
          </div>
        </div>

        {/* Total Pendiente */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pendiente de Cierre
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
              {totalPending.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">{pendingBudgets.length} en seguimiento</p>
          </div>
        </div>

        {/* Ratio de Conversión */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tasa de Conversión
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {conversionRate.toFixed(1)}%
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Ratio de aceptación de ofertas</p>
          </div>
        </div>
      </div>

      {/* Barra de Progreso y Distribución de Estados */}
      {totalCount > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Distribución de Estados de Presupuestos
          </h3>
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            {acceptedBudgets.length > 0 && (
              <div
                style={{ width: `${(acceptedBudgets.length / totalCount) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Aceptados: ${acceptedBudgets.length}`}
              />
            )}
            {pendingBudgets.length > 0 && (
              <div
                style={{ width: `${(pendingBudgets.length / totalCount) * 100}%` }}
                className="bg-amber-400 h-full transition-all"
                title={`Pendientes: ${pendingBudgets.length}`}
              />
            )}
            {budgets.filter((b) => b.status === "RECHAZADO").length > 0 && (
              <div
                style={{
                  width: `${(budgets.filter((b) => b.status === "RECHAZADO").length / totalCount) * 100}%`,
                }}
                className="bg-rose-500 h-full transition-all"
                title="Rechazados"
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Aceptados ({acceptedBudgets.length})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              Pendientes ({pendingBudgets.length})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Rechazados ({budgets.filter((b) => b.status === "RECHAZADO").length})
            </span>
          </div>
        </div>
      )}

      {/* Lista de Presupuestos Recientes */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Últimos Presupuestos Generados
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Accede rápidamente a la vista, firma y compartición
            </p>
          </div>
          <Link
            href="/dashboard/budgets"
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentBudgets.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Aún no has creado ningún presupuesto.
            </p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Crea tu primer presupuesto para enviarlo por WhatsApp o compartirlo en línea.
            </p>
            <Link
              href="/dashboard/budgets/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear mi primer presupuesto</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentBudgets.map((budget) => (
              <div
                key={budget.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* Info Principal */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-brand-600 dark:text-brand-400">
                      {budget.budgetNumber}
                    </span>
                    <StatusBadge status={budget.status} />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">
                    {budget.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {budget.client?.company || budget.client?.name || "Sin cliente asignado"}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(budget.issueDate).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Importe y Acciones */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="block text-base font-bold text-slate-900 dark:text-white">
                      {budget.total.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {budget.applyTax ? `IVA ${budget.taxRate}% incl.` : "Sin IVA"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botón WhatsApp */}
                    <WhatsAppShareButton
                      budgetNumber={budget.budgetNumber}
                      clientName={budget.client?.name}
                      clientPhone={budget.client?.phone}
                      total={budget.total}
                      publicToken={budget.publicToken}
                      companyName={user.companyName}
                      compact
                    />

                    {/* Enlace Público de Firma */}
                    <a
                      href={`/p/${budget.publicToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Abrir enlace público de firma"
                      aria-label="Abrir enlace público"
                    >
                      <Eye className="w-4 h-4" />
                    </a>

                    {/* Descargar PDF */}
                    <a
                      href={`/api/budgets/${budget.id}/pdf`}
                      download={`${budget.budgetNumber}.pdf`}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Descargar PDF"
                      aria-label="Descargar PDF"
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
