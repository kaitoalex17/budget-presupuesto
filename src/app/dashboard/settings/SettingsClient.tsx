"use client";

import React, { useState } from "react";
import {
  Building2,
  Upload,
  CreditCard,
  FileCheck,
  Check,
  Save,
  Coins,
  Sparkles,
} from "lucide-react";

interface SettingsClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
    nif: string | null;
    phone: string | null;
    address: string | null;
    logo: string | null;
    credits: number;
    isFlatRate: boolean;
  };
  settings: {
    budgetPrefix: string;
    nextBudgetSeq: number;
    defaultValidityDays: number;
    defaultPaymentMethod: string;
    bankName: string | null;
    bankAccountIban: string | null;
    bankAccountHolder: string | null;
    defaultPaymentTerms: string | null;
    defaultLegalTerms: string | null;
  } | null;
}

export function SettingsClient({ user, settings }: SettingsClientProps) {
  // Datos del emisor
  const [name, setName] = useState(user.name);
  const [companyName, setCompanyName] = useState(user.companyName || "");
  const [nif, setNif] = useState(user.nif || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [address, setAddress] = useState(user.address || "");
  const [logo, setLogo] = useState<string | null>(user.logo);

  // Ajustes de presupuesto
  const [budgetPrefix, setBudgetPrefix] = useState(settings?.budgetPrefix || "PRES-");
  const [nextBudgetSeq, setNextBudgetSeq] = useState(settings?.nextBudgetSeq || 1);
  const [defaultValidityDays, setDefaultValidityDays] = useState(
    settings?.defaultValidityDays || 30
  );
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(
    settings?.defaultPaymentMethod || "TRANSFERENCIA"
  );
  const [bankName, setBankName] = useState(settings?.bankName || "");
  const [bankAccountIban, setBankAccountIban] = useState(settings?.bankAccountIban || "");
  const [bankAccountHolder, setBankAccountHolder] = useState(settings?.bankAccountHolder || "");
  const [defaultLegalTerms, setDefaultLegalTerms] = useState(
    settings?.defaultLegalTerms ||
      `1. VALIDEZ: 30 días naturales desde la fecha de emisión.
2. FORMA DE PAGO: Conforme a los plazos pactados en la primera hoja.
3. MODIFICACIONES: Cualquier trabajo extraordinario requerirá aprobación previa por escrito.
4. GARANTÍA: 2 años conforme a la legislación vigente.
5. PROTECCIÓN DE DATOS: Los datos serán tratados únicamente para la gestión de este contrato.`
  );

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Manejador de subida de Logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("El logotipo no debe superar los 3 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          companyName,
          nif,
          phone,
          address,
          logo,
          budgetPrefix,
          nextBudgetSeq,
          defaultValidityDays,
          defaultPaymentMethod,
          bankName,
          bankAccountIban,
          bankAccountHolder,
          defaultLegalTerms,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl mx-auto">
      {/* Encabezado y Botón Guardar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ajustes del Emisor y Plantilla de Presupuesto
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configura los datos fiscales, logotipo, plazos de pago y condiciones que aparecerán en los PDFs
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>¡Cambios Guardados!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </>
          )}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Tus datos fiscales y condiciones de presupuesto se han actualizado correctamente.</span>
        </div>
      )}

      {/* Estado del Plan / Créditos */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tu Plan SaaS
          </span>
          <div className="flex items-center gap-2 mt-1">
            {user.isFlatRate ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Sparkles className="w-3.5 h-3.5" />
                Tarifa Plana Ilimitada
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <Coins className="w-3.5 h-3.5" />
                Saldo: {user.credits} Créditos
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 max-w-xs text-right">
          Cada presupuesto creado consume 1 crédito (a menos que el administrador te asigne tarifa plana).
        </p>
      </div>

      {/* 1. Datos Fiscales y Logotipo */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Datos Fiscales y Comerciales
            </h2>
            <p className="text-xs text-slate-500">Aparecerán en el encabezado del presupuesto y facturas</p>
          </div>
        </div>

        {/* Subida de Logotipo */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Logotipo de la Empresa (Aparecerá en el PDF)
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {logo ? (
              <div className="relative w-36 h-20 border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                <img src={logo} alt="Logo de la empresa" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-36 h-20 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs">
                <Upload className="w-5 h-5 mb-1 text-slate-300" />
                <span>Sin logo</span>
              </div>
            )}

            <div className="space-y-1.5 text-center sm:text-left">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir imagen (PNG / JPG)</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              {logo && (
                <button
                  type="button"
                  onClick={() => setLogo(null)}
                  className="block text-xs text-rose-500 hover:underline mt-1"
                >
                  Eliminar logotipo actual
                </button>
              )}
              <p className="text-[11px] text-slate-400">Recomendado formato horizontal y fondo transparente</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de la Empresa o Razón Social
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej: Reformas Integrales García S.L."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de la Persona / Representante *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Juan García López"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              NIF / CIF / DNI
            </label>
            <input
              type="text"
              value={nif}
              onChange={(e) => setNif(e.target.value)}
              placeholder="B-12345678"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Teléfono de Contacto
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 600 000 000"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dirección Fiscal / Sede
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle Gran Vía 10, 28013 Madrid"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Forma de Pago y Datos Bancarios */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Métodos de Cobro y Datos Bancarios
            </h2>
            <p className="text-xs text-slate-500">
              Instrucciones de pago por transferencia o efectivo que se imprimirán en el presupuesto
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Método de Pago por Defecto
            </label>
            <select
              value={defaultPaymentMethod}
              onChange={(e) => setDefaultPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="TRANSFERENCIA">Transferencia Bancaria</option>
              <option value="EFECTIVO">Efectivo / Metálico</option>
              <option value="TARJETA">Tarjeta / TPV Virtual</option>
              <option value="BIZUM">Bizum Profesional</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de la Entidad Bancaria
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Ej: Banco Santander"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Número de Cuenta / IBAN
            </label>
            <input
              type="text"
              value={bankAccountIban}
              onChange={(e) => setBankAccountIban(e.target.value)}
              placeholder="ES91 0000 0000 0000 0000 0000"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Titular de la Cuenta
            </label>
            <input
              type="text"
              value={bankAccountHolder}
              onChange={(e) => setBankAccountHolder(e.target.value)}
              placeholder="Nombre del titular de la cuenta"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Condiciones Legales y Garantías (Hoja Anexa 2 del PDF) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Condiciones Contractuales (Hoja 2 en el PDF)
            </h2>
            <p className="text-xs text-slate-500">
              Cláusulas de validez, garantías legales y condiciones de ejecución que siempre se anexan en página aparte
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Prefijo de Presupuesto
            </label>
            <input
              type="text"
              value={budgetPrefix}
              onChange={(e) => setBudgetPrefix(e.target.value)}
              placeholder="PRES-"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Próximo Número Secuencial
            </label>
            <input
              type="number"
              min="1"
              value={nextBudgetSeq}
              onChange={(e) => setNextBudgetSeq(parseInt(e.target.value) || 1)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Validez por Defecto (Días)
            </label>
            <input
              type="number"
              min="1"
              value={defaultValidityDays}
              onChange={(e) => setDefaultValidityDays(parseInt(e.target.value) || 30)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Texto de Condiciones Legales y Garantía (Hoja Anexa)
          </label>
          <textarea
            rows={7}
            value={defaultLegalTerms}
            onChange={(e) => setDefaultLegalTerms(e.target.value)}
            className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Este texto se imprimirá íntegro en la segunda hoja del PDF de cada presupuesto.
          </p>
        </div>
      </div>
    </form>
  );
}
