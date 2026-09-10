import React from "react";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Receipt, Download, FileSpreadsheet, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const invoices = await prisma.invoice.findMany({
    where: { userId: user.userId },
    include: {
      client: true,
      budget: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);
  const totalSubtotal = invoices.reduce((sum, i) => sum + i.subtotal, 0);
  const totalTax = invoices.reduce((sum, i) => sum + i.taxAmount, 0);
  const totalIrpf = invoices.reduce((sum, i) => sum + i.irpfAmount, 0);

  return (
    <div className="space-y-6">
      {/* Cabecera y Botón Exportar Gestoría */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Facturación y Exportaciones Contables
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Facturas generadas a partir de presupuestos aceptados y descargas para tu gestoría
          </p>
        </div>

        {invoices.length > 0 && (
          <a
            href="/api/invoices/export"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar para Gestoría (CSV / Excel)</span>
          </a>
        )}
      </div>

      {/* Métricas de Facturación */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Facturado</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1 block">
            {totalInvoiced.toFixed(2)} €
          </span>
          <span className="text-[11px] text-slate-400">{invoices.length} facturas emitidas</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Base Imponible</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 font-mono mt-1 block">
            {totalSubtotal.toFixed(2)} €
          </span>
          <span className="text-[11px] text-slate-400">Ingresos netos</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">IVA Repercutido</span>
          <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono mt-1 block">
            {totalTax.toFixed(2)} €
          </span>
          <span className="text-[11px] text-slate-400">Cuota tributaria</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Retenciones IRPF</span>
          <span className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono mt-1 block">
            {totalIrpf.toFixed(2)} €
          </span>
          <span className="text-[11px] text-slate-400">Retenido a cuenta</span>
        </div>
      </div>

      {/* Lista de Facturas */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Registro Oficial de Facturas Emitidas
          </h2>
          <p className="text-xs text-slate-500">
            Numeración correlativa única por perfil para cumplimiento legal
          </p>
        </div>

        {invoices.length === 0 ? (
          <div className="p-10 text-center">
            <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
              Aún no se ha generado ninguna factura
            </p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Cuando un cliente acepte y firme un presupuesto, podrás convertirlo en factura oficial con 1 clic.
            </p>
            <Link
              href="/dashboard/budgets"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700"
            >
              <span>Ver mis presupuestos</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-brand-600 dark:text-brand-400 text-sm">
                      {inv.invoiceNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {inv.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    Cliente: {inv.client?.company || inv.client?.name || "Sin cliente"}
                  </h3>
                  <div className="text-xs text-slate-400 flex flex-wrap gap-x-3">
                    <span>Emisión: {new Date(inv.issueDate).toLocaleDateString("es-ES")}</span>
                    {inv.budget && (
                      <span>Presupuesto de origen: {inv.budget.budgetNumber}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-white block">
                      {inv.total.toFixed(2)} €
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Base: {inv.subtotal.toFixed(2)} € · IVA: {inv.taxAmount.toFixed(2)} €
                    </span>
                  </div>

                  {inv.budget && (
                    <a
                      href={`/api/budgets/${inv.budget.id}/pdf`}
                      download={`${inv.invoiceNumber}.pdf`}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                      title="Descargar justificante PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
