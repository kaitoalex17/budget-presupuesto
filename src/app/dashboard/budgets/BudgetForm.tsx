"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AIBudgetModal } from "@/components/budget/AIBudgetModal";
import { BudgetItemInput } from "@/types";
import {
  Plus,
  Trash2,
  Sparkles,
  BookmarkPlus,
  Check,
  Save,
  ArrowLeft,
  Coins,
  CreditCard,
  FileCheck,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";

interface BudgetFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  clients: Array<{ id: string; name: string; company: string | null }>;
  savedConcepts: Array<{
    id: string;
    title: string;
    description: string | null;
    defaultPrice: number;
    type: string;
  }>;
  settings: {
    budgetPrefix: string;
    nextBudgetSeq: number;
    defaultValidityDays: number;
    defaultPaymentMethod: string;
    defaultLegalTerms: string | null;
  } | null;
  selectedClientId?: string;
  userCredits: number;
  isFlatRate: boolean;
}

export function BudgetForm({
  initialData,
  clients: initialClients,
  savedConcepts,
  settings,
  selectedClientId,
  userCredits,
  isFlatRate,
}: BudgetFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);

  // Clientes
  const [clients, setClients] = useState(initialClients);
  const [clientId, setClientId] = useState(
    initialData?.clientId || selectedClientId || (clients.length > 0 ? clients[0].id : "")
  );
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientCompany, setNewClientCompany] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  // Datos del presupuesto
  const [budgetNumber, setBudgetNumber] = useState(
    initialData?.budgetNumber ||
      `${settings?.budgetPrefix || "PRES-"}${String(settings?.nextBudgetSeq || 1).padStart(4, "0")}`
  );
  const [title, setTitle] = useState(initialData?.title || "");
  const [issueDate, setIssueDate] = useState(
    initialData?.issueDate
      ? new Date(initialData.issueDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [validityDays, setValidityDays] = useState(settings?.defaultValidityDays || 30);

  // Partidas
  const [items, setItems] = useState<BudgetItemInput[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items
      : [
          {
            type: "PARTIDA",
            concept: "",
            description: "",
            quantity: 1,
            unitPrice: 0,
            amount: 0,
            order: 1,
          },
        ]
  );

  // Checkboxes para guardar partida en catálogo
  const [saveToCatalogIndices, setSaveToCatalogIndices] = useState<number[]>([]);

  // Configuración fiscal
  const [applyTax, setApplyTax] = useState(initialData ? initialData.applyTax : true);
  const [taxRate, setTaxRate] = useState(initialData?.taxRate ?? 21);
  const [irpfRate, setIrpfRate] = useState(initialData?.irpfRate ?? 0);
  const [discount, setDiscount] = useState(initialData?.discount ?? 0);

  // Modalidad y plazos de pago
  const [paymentMethod, setPaymentMethod] = useState(
    initialData?.paymentMethod || settings?.defaultPaymentMethod || "TRANSFERENCIA"
  );
  const [installmentPreset, setInstallmentPreset] = useState("50-50");
  const [legalTerms, setLegalTerms] = useState(
    initialData?.legalTerms ||
      settings?.defaultLegalTerms ||
      `1. VALIDEZ: 30 días naturales a partir de la emisión.
2. FORMA DE PAGO: Según plazos acordados.
3. GARANTÍA: 2 años en mano de obra conforme a ley.
4. CUALQUIER EXTRA: Requerirá aprobación previa por escrito.`
  );

  // Modales
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cálculos automáticos
  const subtotal = items.reduce((acc, it) => {
    const itemTotal = it.type === "PARTIDA" && it.amount ? it.amount : it.quantity * it.unitPrice;
    return acc + itemTotal;
  }, 0);

  const taxableBase = Math.max(0, subtotal - (Number(discount) || 0));
  const taxAmount = applyTax ? (taxableBase * (Number(taxRate) || 0)) / 100 : 0;
  const irpfAmount = (Number(irpfRate) || 0) > 0 ? (taxableBase * Number(irpfRate)) / 100 : 0;
  const total = taxableBase + taxAmount - irpfAmount;

  // Calcular plazos proporcionales
  const calculateInstallments = () => {
    if (installmentPreset === "100") {
      return [{ title: "100% Pago único al contado / entrega", percentage: 100, amount: total }];
    } else if (installmentPreset === "50-50") {
      return [
        { title: "50% al inicio y aceptación de los trabajos", percentage: 50, amount: total * 0.5 },
        { title: "50% a la finalización y entrega", percentage: 50, amount: total * 0.5 },
      ];
    } else if (installmentPreset === "40-30-30") {
      return [
        { title: "40% al inicio de obra / acopio", percentage: 40, amount: total * 0.4 },
        { title: "30% a mitad de ejecución", percentage: 30, amount: total * 0.3 },
        { title: "30% a la finalización y conformidad", percentage: 30, amount: total * 0.3 },
      ];
    }
    return [{ title: "Pago según acuerdo particular", percentage: 100, amount: total }];
  };

  // Manejo de partidas
  const handleItemChange = (index: number, field: keyof BudgetItemInput, value: unknown) => {
    const updated = [...items];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[field] = value;

    // Recalcular importe
    if (field === "quantity" || field === "unitPrice") {
      const q = field === "quantity" ? Number(value) : updated[index].quantity;
      const p = field === "unitPrice" ? Number(value) : updated[index].unitPrice;
      updated[index].amount = q * p;
    }

    setItems(updated);
  };

  const addItem = (type: "UNIDAD" | "PARTIDA" = "PARTIDA") => {
    setItems([
      ...items,
      {
        type,
        concept: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        order: items.length + 1,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
    setSaveToCatalogIndices(saveToCatalogIndices.filter((i) => i !== index));
  };

  const handleApplyAiItems = (suggestedTitle: string, suggestedItems: BudgetItemInput[]) => {
    if (!title) setTitle(suggestedTitle);
    setItems(suggestedItems);
  };

  const handleInsertFromCatalog = (concept: (typeof savedConcepts)[0]) => {
    const newItem: BudgetItemInput = {
      type: concept.type as "UNIDAD" | "PARTIDA",
      concept: concept.title,
      description: concept.description || "",
      quantity: 1,
      unitPrice: concept.defaultPrice,
      amount: concept.defaultPrice,
      order: items.length + 1,
    };
    setItems([...items, newItem]);
    setCatalogModalOpen(false);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClientName,
          company: newClientCompany,
          phone: newClientPhone,
          email: newClientEmail,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setClients([created, ...clients]);
        setClientId(created.id);
        setNewClientModalOpen(false);
        setNewClientName("");
        setNewClientCompany("");
        setNewClientPhone("");
        setNewClientEmail("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Conceptos para guardar en catálogo
    const saveToCatalogItems = saveToCatalogIndices.map((idx) => items[idx]).filter(Boolean);

    // Calcular fecha de validez
    const validUntilDate = new Date(
      new Date(issueDate).getTime() + Number(validityDays) * 24 * 60 * 60 * 1000
    );

    const payload = {
      clientId: clientId || null,
      budgetNumber,
      title,
      issueDate: new Date(issueDate).toISOString(),
      validUntil: validUntilDate.toISOString(),
      applyTax,
      taxRate: Number(taxRate),
      irpfRate: Number(irpfRate),
      discount: Number(discount),
      paymentMethod,
      paymentTerms: calculateInstallments(),
      legalTerms,
      items,
      saveToCatalog: saveToCatalogItems,
    };

    try {
      const url = isEditing ? `/api/budgets/${initialData.id}` : "/api/budgets";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al guardar el presupuesto");
      }

      router.push("/dashboard/budgets");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al procesar el presupuesto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Cabecera y Botón Guardar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/budgets"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isEditing ? `Editar Presupuesto ${budgetNumber}` : "Nuevo Presupuesto"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEditing
                ? "Modifica partidas, impuestos o condiciones"
                : "Crea una propuesta económica estructurada con hoja anexa y firma en línea"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isFlatRate && !isEditing && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Coins className="w-3.5 h-3.5" />
              <span>Consumirá 1 crédito (Saldo: {userCredits})</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Guardando..." : isEditing ? "Actualizar" : "Guardar Presupuesto"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* 1. Datos Generales y Cliente */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          1. Destinatario y Datos del Documento
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Selector de Cliente */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cliente / Destinatario *
              </label>
              <button
                type="button"
                onClick={() => setNewClientModalOpen(true)}
                className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Crear cliente rápido</span>
              </button>
            </div>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Sin cliente asignado (Público General) --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company ? `${c.company} (${c.name})` : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Número de Presupuesto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nº de Presupuesto *
            </label>
            <input
              type="text"
              required
              value={budgetNumber}
              onChange={(e) => setBudgetNumber(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Proyecto / Título */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título o Proyecto *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Reforma Integral de Cuarto de Baño / Instalación Eléctrica Nave"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Fecha y Validez */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha Emisión
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Validez (Días)
              </label>
              <input
                type="number"
                min="1"
                value={validityDays}
                onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Editor de Partidas y Conceptos */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              2. Partidas y Conceptos del Presupuesto
            </h2>
            <p className="text-xs text-slate-500">
              Añade por partida alzada o por unidades/horas. No es obligatorio precio unitario si es partida.
            </p>
          </div>

          {/* Acciones Rápidas: IA y Catálogo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Asistente IA ✨</span>
            </button>

            {savedConcepts.length > 0 && (
              <button
                type="button"
                onClick={() => setCatalogModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Desde Catálogo</span>
              </button>
            )}
          </div>
        </div>

        {/* Lista de Partidas */}
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-400">Partida #{index + 1}</span>

                <div className="flex items-center gap-2">
                  {/* Selector Tipo */}
                  <select
                    value={item.type}
                    onChange={(e) =>
                      handleItemChange(index, "type", e.target.value as "UNIDAD" | "PARTIDA")
                    }
                    className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <option value="PARTIDA">Partida Alzada (Importe Fijo)</option>
                    <option value="UNIDAD">Por Unidad / Horas</option>
                  </select>

                  {/* Eliminar Partida */}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Eliminar partida"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Título de la partida */}
              <div>
                <input
                  type="text"
                  required
                  value={item.concept}
                  onChange={(e) => handleItemChange(index, "concept", e.target.value)}
                  placeholder="Título del concepto o trabajo..."
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Descripción detallada */}
              <div>
                <textarea
                  rows={2}
                  value={item.description || ""}
                  onChange={(e) => handleItemChange(index, "description", e.target.value)}
                  placeholder="Detalles técnicos, materiales o especificaciones..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Cantidad, Precio e Importe */}
              <div className="grid grid-cols-3 gap-3 items-end pt-1">
                {item.type === "UNIDAD" ? (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Cantidad / Uds.
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Precio Unitario (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Modalidad
                    </label>
                    <span className="text-xs text-slate-400 italic">
                      Partida a precio alzado (sin desglose de unidades)
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1 text-right">
                    Importe Total (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) =>
                      handleItemChange(index, "amount", parseFloat(e.target.value) || 0)
                    }
                    readOnly={item.type === "UNIDAD"}
                    className={`w-full px-2.5 py-1.5 text-xs font-bold text-right rounded-xl border border-slate-300 dark:border-slate-700 ${
                      item.type === "UNIDAD"
                        ? "bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 cursor-not-allowed"
                        : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    }`}
                  />
                </div>
              </div>

              {/* Checkbox: Guardar en Catálogo */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`save-cat-${index}`}
                  checked={saveToCatalogIndices.includes(index)}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSaveToCatalogIndices(
                        e.target.checked
                          ? [...saveToCatalogIndices, index]
                          : saveToCatalogIndices.filter((i) => i !== index)
                      );
                    }
                  }}
                  className="rounded text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                />
                <label
                  htmlFor={`save-cat-${index}`}
                  className="text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  Guardar este concepto en mi catálogo para la próxima vez
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Botones Añadir Partida */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => addItem("PARTIDA")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Añadir Partida Alzada</span>
          </button>
          <button
            type="button"
            onClick={() => addItem("UNIDAD")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Añadir por Cantidad / Horas</span>
          </button>
        </div>
      </div>

      {/* 3. Configuración Fiscal, Totales y Plazos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formas y Plazos de Pago */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              3. Forma y Fraccionamiento de Pagos
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Método de Pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="TRANSFERENCIA">Transferencia Bancaria</option>
              <option value="EFECTIVO">Efectivo / Metálico</option>
              <option value="TARJETA">Tarjeta / TPV</option>
              <option value="BIZUM">Bizum</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fraccionamiento en Plazos (Cálculo Automático)
            </label>
            <select
              value={installmentPreset}
              onChange={(e) => setInstallmentPreset(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 mb-2"
            >
              <option value="50-50">2 Plazos: 50% al inicio y 50% a la entrega</option>
              <option value="40-30-30">3 Plazos: 40% inicio, 30% mitad, 30% entrega</option>
              <option value="100">1 Plazo: 100% Pago único al contado / entrega</option>
            </select>

            {/* Vista previa de cuotas calculadas */}
            <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Cuotas calculadas sobre el total ({total.toFixed(2)} €):
              </span>
              {calculateInstallments().map((inst, i) => (
                <div key={i} className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>{inst.title}</span>
                  <span className="font-bold font-mono">{inst.amount.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Totales y Cálculo de Impuestos */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Resumen Económico e Impuestos
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Base Imponible / Subtotal:</span>
              <span className="font-bold font-mono">{subtotal.toFixed(2)} €</span>
            </div>

            {/* Descuento */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-600 dark:text-slate-400">Descuento (€):</span>
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-28 px-2.5 py-1 text-xs text-right rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>

            {/* Control de IVA */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="applyTaxToggle"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <label htmlFor="applyTaxToggle" className="text-xs font-semibold cursor-pointer">
                  Aplicar IVA
                </label>
              </div>

              {applyTax && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                    className="text-xs py-1 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  >
                    <option value="21">21% (General)</option>
                    <option value="10">10% (Reducido)</option>
                    <option value="4">4% (Superreducido)</option>
                    <option value="0">0% (Exento)</option>
                  </select>
                  <span className="text-xs font-mono font-bold w-20 text-right">
                    +{taxAmount.toFixed(2)} €
                  </span>
                </div>
              )}
            </div>

            {/* Control de Retención IRPF */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-400">Retención IRPF:</span>
              <div className="flex items-center gap-1.5">
                <select
                  value={irpfRate}
                  onChange={(e) => setIrpfRate(parseFloat(e.target.value))}
                  className="text-xs py-1 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                >
                  <option value="0">Sin retención (0%)</option>
                  <option value="7">7% (Nuevos autónomos)</option>
                  <option value="15">15% (Profesional estándar)</option>
                  <option value="19">19%</option>
                </select>
                {irpfRate > 0 && (
                  <span className="text-xs font-mono font-bold text-rose-600 w-20 text-right">
                    -{irpfAmount.toFixed(2)} €
                  </span>
                )}
              </div>
            </div>

            {/* TOTAL FINAL */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
              <span className="text-base font-bold text-slate-900 dark:text-white">
                TOTAL FINAL:
              </span>
              <span className="text-2xl font-black text-brand-600 dark:text-brand-400 font-mono">
                {total.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Condiciones Contractuales (Hoja Anexa en PDF) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            4. Condiciones Legales y Garantías (Se imprimen en la Hoja 2)
          </h3>
        </div>
        <textarea
          rows={5}
          value={legalTerms}
          onChange={(e) => setLegalTerms(e.target.value)}
          className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <p className="text-[11px] text-slate-400">
          Estas condiciones siempre se generan en una segunda hoja separada del presupuesto oficial.
        </p>
      </div>

      {/* Modal Asistente IA */}
      <AIBudgetModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onApplyItems={handleApplyAiItems}
      />

      {/* Modal Selección Desde Catálogo */}
      {catalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Seleccionar Concepto del Catálogo
              </h3>
              <button
                type="button"
                onClick={() => setCatalogModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {savedConcepts.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => handleInsertFromCatalog(sc)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 cursor-pointer flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 transition-colors"
                >
                  <div>
                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white">
                      {sc.title}
                    </h4>
                    {sc.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">{sc.description}</p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-brand-600 shrink-0 ml-2">
                    {sc.defaultPrice.toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Cliente Rápido */}
      {newClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Crear Cliente Rápido
              </h3>
              <button
                type="button"
                onClick={() => setNewClientModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Nombre Contacto *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej: Pedro Martínez"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Empresa</label>
                <input
                  type="text"
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                  placeholder="Ej: Edificaciones Centro S.L."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="600 000 000"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewClientModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateClient}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700"
                >
                  Crear y Seleccionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
