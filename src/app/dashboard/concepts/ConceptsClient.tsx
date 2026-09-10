"use client";

import React, { useState } from "react";
import { Plus, Search, Trash2, Edit2, BookmarkCheck, X, Check } from "lucide-react";

interface Concept {
  id: string;
  title: string;
  description: string | null;
  defaultPrice: number;
  type: string;
}

export function ConceptsClient({ initialConcepts }: { initialConcepts: Concept[] }) {
  const [concepts, setConcepts] = useState<Concept[]>(initialConcepts);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState<Concept | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("0");
  const [type, setType] = useState("UNIDAD");
  const [loading, setLoading] = useState(false);

  const openCreateModal = () => {
    setEditingConcept(null);
    setTitle("");
    setDescription("");
    setDefaultPrice("0");
    setType("UNIDAD");
    setModalOpen(true);
  };

  const openEditModal = (c: Concept) => {
    setEditingConcept(c);
    setTitle(c.title);
    setDescription(c.description || "");
    setDefaultPrice(c.defaultPrice.toString());
    setType(c.type);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingConcept) {
        // Edit
        const res = await fetch(`/api/concepts/${editingConcept.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            defaultPrice: parseFloat(defaultPrice) || 0,
            type,
          }),
        });

        if (res.ok) {
          setConcepts(
            concepts.map((c) =>
              c.id === editingConcept.id
                ? { ...c, title, description, defaultPrice: parseFloat(defaultPrice) || 0, type }
                : c
            )
          );
          setModalOpen(false);
        }
      } else {
        // Create
        const res = await fetch("/api/concepts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            defaultPrice: parseFloat(defaultPrice) || 0,
            type,
          }),
        });

        if (res.ok) {
          const newC = await res.json();
          setConcepts([newC, ...concepts]);
          setModalOpen(false);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este concepto del catálogo?")) return;

    try {
      const res = await fetch(`/api/concepts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConcepts(concepts.filter((c) => c.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = concepts.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Catálogo de Conceptos y Partidas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Preconfigura precios y trabajos frecuentes para insertarlos con un clic en tus presupuestos
          </p>
        </div>

        <button
          onClick={openCreateModal}
          type="button"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Concepto</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título o descripción..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Grid de Conceptos */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center">
          <BookmarkCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No se encontraron conceptos en el catálogo
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Crea conceptos predefinidos o agrégalos mientras redactas un presupuesto.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-brand-300 dark:hover:border-brand-700 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {item.type === "PARTIDA" ? "Partida Alzada" : "Por Unidad / Hora"}
                  </span>
                  <span className="text-base font-bold text-brand-600 dark:text-brand-400">
                    {item.defaultPrice.toFixed(2)} €
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Editar concepto"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Eliminar concepto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingConcept ? "Editar Concepto" : "Nuevo Concepto de Catálogo"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título del Concepto / Trabajo *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Pintura plástica lisa blanca"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción o Especificaciones Técnicas
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles sobre materiales, mano de obra o condiciones..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Partida
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="UNIDAD">Por Unidad / Hora</option>
                    <option value="PARTIDA">Partida Alzada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Precio por Defecto (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Concepto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
