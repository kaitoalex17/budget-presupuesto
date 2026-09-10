"use client";

import React, { useState } from "react";
import { Sparkles, X, Check, Loader2 } from "lucide-react";
import { BudgetItemInput } from "@/types";

interface AIBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyItems: (title: string, items: BudgetItemInput[]) => void;
}

export function AIBudgetModal({ isOpen, onClose, onApplyItems }: AIBudgetModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    suggestedTitle: string;
    suggestedItems: BudgetItemInput[];
    summary: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error("Error al procesar la petición con la IA");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al generar partidas");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApplyItems(result.suggestedTitle, result.suggestedItems);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Asistente de Presupuestos con IA
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Describe el trabajo o proyecto y la IA generará las partidas estructuradas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Input */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ¿Qué trabajos vas a presupuestar?
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Reforma de baño de 6m2 con fontanería nueva, alicatado gris, plato de ducha de resina de 120x80 y mampara de cristal..."
              className="w-full p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setPrompt(
                    "Reforma completa de cuarto de baño con fontanería multicapa, alicatado porcelánico, plato de ducha y grifería termostática."
                  )
                }
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              >
                + Ejemplo Baño
              </button>
              <button
                type="button"
                onClick={() =>
                  setPrompt(
                    "Pintura plástica lisa lavable blanca en vivienda de 90m2 incluyendo saneado de paredes y tapado de grietas."
                  )
                }
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              >
                + Ejemplo Pintura
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generando partidas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generar Partidas</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-3 rounded-xl text-xs bg-rose-50 text-rose-600 border border-rose-200">
            {error}
          </div>
        )}

        {/* Resultados Generados */}
        {result && (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {result.suggestedTitle}
                </h4>
                <p className="text-xs text-slate-500">{result.summary}</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {result.suggestedItems.length} partidas creadas
              </span>
            </div>

            {/* Preview de partidas */}
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {result.suggestedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.concept}
                    </span>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.amount.toFixed(2)} €
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {item.type === "PARTIDA"
                        ? "Partida"
                        : `${item.quantity} x ${item.unitPrice} €`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón Aplicar al Presupuesto */}
            <button
              onClick={handleApply}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Check className="w-4 h-4" />
              <span>Insertar estas partidas en el presupuesto</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
