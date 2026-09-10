"use client";

import React, { useState } from "react";
import { SignaturePad } from "@/components/budget/SignaturePad";
import { StatusBadge } from "@/components/budget/StatusBadge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  FileText,
  Download,
  CheckCircle2,
  Calendar,
  Building,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Send,
  HelpCircle,
} from "lucide-react";

interface PublicBudgetViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialBudget: any;
  token: string;
}

export function PublicBudgetView({ initialBudget, token }: PublicBudgetViewProps) {
  const [budget, setBudget] = useState(initialBudget);
  const [signerName, setSignerName] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [signSuccess, setSignSuccess] = useState(
    budget.status === "ACEPTADO" || budget.status === "FACTURADO"
  );

  // Comentarios / Dudas del cliente
  const [comment, setComment] = useState(budget.clientNotes || "");
  const [sendingComment, setSendingComment] = useState(false);
  const [commentSaved, setCommentSaved] = useState(false);

  // Pestaña o toggle para ver hoja de condiciones
  const [showTerms, setShowTerms] = useState(false);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim() || !signatureImage) {
      alert("Por favor, introduce tu nombre completo y realiza tu firma en el recuadro.");
      return;
    }

    setSigning(true);
    try {
      const res = await fetch(`/api/public/budget/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName, signatureImage }),
      });

      if (res.ok) {
        const data = await res.json();
        setBudget({
          ...budget,
          status: "ACEPTADO",
          signerName,
          signatureImage,
          signedAt: new Date().toISOString(),
        });
        setSignSuccess(true);
      } else {
        const err = await res.json();
        alert(err.error || "Error al registrar la firma");
      }
    } finally {
      setSigning(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingComment(true);
    try {
      const res = await fetch(`/api/public/budget/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientNotes: comment }),
      });
      if (res.ok) {
        setCommentSaved(true);
        setTimeout(() => setCommentSaved(false), 3000);
      }
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 py-6 px-4 sm:px-6 lg:px-8">
      {/* Barra superior flotante */}
      <div className="max-w-4xl mx-auto flex items-center justify-between pb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
            <FileText className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            {budget.user.companyName || budget.user.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href={`/api/budgets/${budget.id}/pdf`}
            download={`${budget.budgetNumber}.pdf`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner de Estado Firmado */}
        {signSuccess && (
          <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  ¡Presupuesto firmado y aceptado!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Firmado por {budget.signerName || signerName} el{" "}
                  {new Date(budget.signedAt || Date.now()).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  . Ambas partes disponen de copia válida.
                </p>
              </div>
            </div>

            <a
              href={`/api/budgets/${budget.id}/pdf`}
              download={`${budget.budgetNumber}.pdf`}
              className="shrink-0 hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Copia en PDF</span>
            </a>
          </div>
        )}

        {/* Documento Principal del Presupuesto (Estilo Hoja A4) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-10 space-y-8">
          {/* Encabezado: Emisor y Número */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            {/* Emisor */}
            <div className="space-y-2">
              {budget.user.logo ? (
                <img
                  src={budget.user.logo}
                  alt="Logotipo de la empresa"
                  className="h-12 w-auto object-contain mb-2"
                />
              ) : (
                <h2 className="text-xl font-extrabold text-brand-600 dark:text-brand-400">
                  {budget.user.companyName || budget.user.name}
                </h2>
              )}
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                {budget.user.companyName && <p className="font-semibold">{budget.user.name}</p>}
                {budget.user.nif && <p>NIF/CIF: {budget.user.nif}</p>}
                {budget.user.address && <p>{budget.user.address}</p>}
                {budget.user.phone && <p>Tel: {budget.user.phone}</p>}
                {budget.user.email && <p>Email: {budget.user.email}</p>}
              </div>
            </div>

            {/* Número y Fecha */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-left sm:text-right min-w-[200px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Presupuesto Oficial
              </span>
              <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400 block mt-0.5">
                {budget.budgetNumber}
              </span>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 space-y-0.5">
                <p>Fecha: {new Date(budget.issueDate).toLocaleDateString("es-ES")}</p>
                <p>Válido hasta: {new Date(budget.validUntil).toLocaleDateString("es-ES")}</p>
              </div>
              <div className="mt-2.5">
                <StatusBadge status={budget.status} />
              </div>
            </div>
          </div>

          {/* Destinatario / Cliente */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Destinatario / Cliente
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {budget.client?.company || budget.client?.name || "Cliente General"}
            </h3>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {budget.client?.company && <span>Att: {budget.client.name}</span>}
              {budget.client?.nif && <span>NIF: {budget.client.nif}</span>}
              {budget.client?.address && <span>{budget.client.address}</span>}
              {budget.client?.phone && <span>Tel: {budget.client.phone}</span>}
            </div>
          </div>

          {/* Proyecto / Título */}
          <div className="border-l-4 border-brand-500 pl-4 py-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Objeto del Presupuesto</span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {budget.title}
            </h4>
          </div>

          {/* Tabla de Partidas */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  <th className="py-3 px-2">#</th>
                  <th className="py-3 px-2">Concepto / Partida</th>
                  <th className="py-3 px-2 text-center">Tipo</th>
                  <th className="py-3 px-2 text-center">Cant.</th>
                  <th className="py-3 px-2 text-right">Precio Unit.</th>
                  <th className="py-3 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {budget.items.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-2 text-xs text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <span className="font-semibold block text-slate-900 dark:text-white">
                        {item.concept}
                      </span>
                      {item.description && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap block mt-0.5">
                          {item.description}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center text-xs">
                      {item.type === "PARTIDA" ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                          Partida
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px]">
                          Unidad
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center text-xs font-mono">
                      {item.type === "PARTIDA" ? "-" : item.quantity}
                    </td>
                    <td className="py-3 px-2 text-right text-xs font-mono">
                      {item.type === "PARTIDA" ? "-" : `${item.unitPrice.toFixed(2)} €`}
                    </td>
                    <td className="py-3 px-2 text-right font-bold font-mono">
                      {item.amount.toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Desglose de Totales y Condiciones de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Formas y Plazos de Pago */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>Modalidad y Plazos de Pago</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl">
                <p>
                  <strong>Método:</strong> {budget.paymentMethod || "Transferencia Bancaria"}
                </p>
                {budget.user.settings?.bankAccountIban && (
                  <p>
                    <strong>IBAN:</strong> {budget.user.settings.bankAccountIban}
                  </p>
                )}

                {/* Plazos de pago */}
                {budget.paymentTerms && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700">
                    <strong className="block mb-1 text-slate-700 dark:text-slate-300">
                      Fraccionamiento pactado:
                    </strong>
                    {(() => {
                      try {
                        const terms = JSON.parse(budget.paymentTerms);
                        if (Array.isArray(terms)) {
                          return (
                            <ul className="list-disc list-inside space-y-1">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {terms.map((t: any, i: number) => (
                                <li key={i}>
                                  {t.title} {t.amount ? `(${t.amount.toFixed(2)} €)` : ""}
                                </li>
                              ))}
                            </ul>
                          );
                        }
                      } catch {
                        return <p>{budget.paymentTerms}</p>;
                      }
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Totales */}
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Base Imponible / Subtotal:</span>
                <span className="font-semibold font-mono">{budget.subtotal.toFixed(2)} €</span>
              </div>

              {budget.discount > 0 && (
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Descuento aplicado:</span>
                  <span className="font-semibold font-mono text-emerald-600">
                    -{budget.discount.toFixed(2)} €
                  </span>
                </div>
              )}

              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>IVA {budget.applyTax ? `(${budget.taxRate}%)` : "(Exento)"}:</span>
                <span className="font-semibold font-mono">
                  {budget.applyTax ? `${budget.taxAmount.toFixed(2)} €` : "0,00 €"}
                </span>
              </div>

              {budget.irpfRate > 0 && (
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Retención IRPF (-{budget.irpfRate}%):</span>
                  <span className="font-semibold font-mono text-rose-600">
                    -{budget.irpfAmount.toFixed(2)} €
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  TOTAL PRESUPUESTO:
                </span>
                <span className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 font-mono">
                  {budget.total.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>

          {/* Toggle de Hoja Anexa de Condiciones Legales */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowTerms(!showTerms)}
              className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{showTerms ? "Ocultar condiciones generales" : "Ver Hoja 2 de Condiciones Generales y Garantía"}</span>
            </button>

            {showTerms && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed animate-in fade-in duration-200">
                {budget.legalTerms || "Condiciones contractuales estándar aplicables a este servicio."}
              </div>
            )}
          </div>

          {/* Recuadro de Firma Existente si ya está firmado */}
          {budget.signatureImage && (
            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 max-w-sm ml-auto text-right space-y-2">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                Firma Digital Registrada
              </span>
              <img
                src={budget.signatureImage}
                alt="Firma del cliente"
                className="h-16 w-auto ml-auto bg-white rounded-lg p-1 border border-emerald-100"
              />
              <p className="text-[11px] text-slate-500">
                Firmado por: <strong>{budget.signerName}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Formulario de Firma Digital para el Cliente (Si aún no está firmado) */}
        {!signSuccess && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Aceptación y Firma Digital del Presupuesto
                </h3>
                <p className="text-xs text-slate-500">
                  Firma con el dedo en tu teléfono móvil o con el ratón en tu ordenador para dar tu conformidad
                </p>
              </div>
            </div>

            <form onSubmit={handleSign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre y Apellidos del Firmante / Aceptante *
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Ej: María Gómez López"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trazo de Firma Digital *
                </label>
                <SignaturePad onSave={(dataUrl) => setSignatureImage(dataUrl)} />
              </div>

              <button
                type="submit"
                disabled={signing || !signerName.trim() || !signatureImage}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{signing ? "Registrando firma..." : "Aceptar y Firmar Presupuesto"}</span>
              </button>
            </form>
          </div>
        )}

        {/* Sección de Consultas / Comentarios del Cliente al Emisor */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              ¿Tienes alguna duda, comentario o modificación sobre este presupuesto?
            </h4>
          </div>
          <form onSubmit={handleSendComment} className="space-y-3">
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escribe aquí cualquier comentario o pregunta que desees trasladar al profesional..."
              className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex items-center justify-between">
              {commentSaved ? (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Comentario enviado al emisor
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  El emisor verá este comentario en su panel de control.
                </span>
              )}
              <button
                type="submit"
                disabled={sendingComment || !comment.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingComment ? "Enviando..." : "Enviar Comentario"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
