"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Coins,
  Sparkles,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Check,
  Building,
  CreditCard,
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  companyName: string | null;
  role: string;
  credits: number;
  isFlatRate: boolean;
  isActive: boolean;
  phone: string | null;
  createdAt: string;
  budgetCount: number;
  clientCount: number;
  invoiceCount: number;
}

interface Transaction {
  id: string;
  userEmail: string;
  userName: string;
  amount: number;
  type: string;
  notes: string | null;
  createdAt: string;
}

export function AdminUsersClient({
  initialUsers,
  initialTransactions,
}: {
  initialUsers: AdminUser[];
  initialTransactions: Transaction[];
}) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [search, setSearch] = useState("");

  // Modal Nuevo Usuario
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [credits, setCredits] = useState("10");
  const [isFlatRate, setIsFlatRate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal Recarga de Créditos / Tarifa Plana
  const [rechargeModalUser, setRechargeModalUser] = useState<AdminUser | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState("10");
  const [flatRateToggle, setFlatRateToggle] = useState(false);
  const [rechargeNotes, setRechargeNotes] = useState("");
  const [recharging, setRecharging] = useState(false);

  // Estadísticas globales
  const totalUsers = users.length;
  const flatRateUsers = users.filter((u) => u.isFlatRate).length;
  const totalSystemCredits = users.reduce((sum, u) => sum + (u.isFlatRate ? 0 : u.credits), 0);
  const totalBudgetsCreated = users.reduce((sum, u) => sum + u.budgetCount, 0);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          companyName,
          credits: parseInt(credits) || 0,
          isFlatRate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al crear el usuario");
      }

      setUsers([
        {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          companyName: companyName || null,
          role: "USER",
          credits: data.user.credits,
          isFlatRate: data.user.isFlatRate,
          isActive: true,
          phone: null,
          createdAt: new Date().toISOString(),
          budgetCount: 0,
          clientCount: 0,
          invoiceCount: 0,
        },
        ...users,
      ]);

      setCreateModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setCompanyName("");
      setCredits("10");
      setIsFlatRate(false);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Error al registrar usuario");
    } finally {
      setCreating(false);
    }
  };

  const handleRechargeCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeModalUser) return;
    setRecharging(true);

    try {
      const res = await fetch(`/api/admin/users/${rechargeModalUser.id}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rechargeAmount: parseInt(rechargeAmount) || 0,
          setFlatRate: flatRateToggle,
          notes: rechargeNotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(
          users.map((u) =>
            u.id === rechargeModalUser.id
              ? { ...u, credits: data.credits, isFlatRate: data.isFlatRate }
              : u
          )
        );

        setTransactions([
          {
            id: Date.now().toString(),
            userEmail: rechargeModalUser.email,
            userName: rechargeModalUser.name,
            amount: parseInt(rechargeAmount) || 0,
            type: flatRateToggle !== rechargeModalUser.isFlatRate ? "TARIFA_PLANA" : "RECARGA",
            notes: rechargeNotes || "Recarga manual",
            createdAt: new Date().toISOString(),
          },
          ...transactions,
        ]);

        setRechargeModalUser(null);
      }
    } finally {
      setRecharging(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const newStatus = !user.isActive;
    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (res.ok) {
        setUsers(users.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openRecharge = (user: AdminUser) => {
    setRechargeModalUser(user);
    setRechargeAmount("10");
    setFlatRateToggle(user.isFlatRate);
    setRechargeNotes("");
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.companyName && u.companyName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Cabecera y Botón Nuevo Usuario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Control de Usuarios SaaS y Facturación de Créditos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Asigna puntos para presupuestos, activa tarifas planas o suspende suscripciones
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          type="button"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Dar de Alta Usuario SaaS</span>
        </button>
      </div>

      {/* Métricas Globales del SaaS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Usuarios SaaS</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white block mt-1">
            {totalUsers}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Cuentas registradas</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Tarifas Planas Activas</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 block mt-1">
            {flatRateUsers}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Suscripciones ilimitadas</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Créditos en Circulación</span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 block mt-1">
            {totalSystemCredits}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Puntos prepago pendientes</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Presupuestos Generados</span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 block mt-1">
            {totalBudgetsCreated}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Volumen global emitido</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar usuarios por nombre, email o empresa..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase bg-slate-50/70 dark:bg-slate-800/40">
                <th className="py-3 px-4">Usuario / Empresa</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-center">Plan / Créditos</th>
                <th className="py-3 px-4 text-center">Presupuestos</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {u.name}
                        </span>
                        {u.companyName && (
                          <span className="text-xs text-slate-400 block">{u.companyName}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono">{u.email}</td>
                  <td className="py-3.5 px-4 text-center">
                    {u.isFlatRate ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <Sparkles className="w-3 h-3" />
                        Tarifa Plana
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <Coins className="w-3 h-3" />
                        {u.credits} Créditos
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs font-semibold">
                    {u.budgetCount} ({u.clientCount} clientes)
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                        <XCircle className="w-3.5 h-3.5" />
                        Suspendida
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openRecharge(u)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
                      >
                        Recargar / Plan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                          u.isActive
                            ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        }`}
                      >
                        {u.isActive ? "Suspender" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial Reciente de Transacciones de Créditos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Auditoría Reciente de Créditos y Movimientos
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {transactions.map((tx) => (
            <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {tx.userName} ({tx.userEmail})
                </span>
                <span className="text-slate-400">• {tx.notes}</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`font-bold font-mono ${
                    tx.amount > 0
                      ? "text-emerald-600"
                      : tx.amount < 0
                      ? "text-rose-600"
                      : "text-slate-500"
                  }`}
                >
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount} pts
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(tx.createdAt).toLocaleDateString("es-ES")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Crear Usuario SaaS */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Dar de Alta Nuevo Usuario SaaS
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 text-xs bg-rose-50 text-rose-600 rounded-xl">{createError}</div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: David Ruiz"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Empresa (Opcional)</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej: Carpintería Moderna S.L."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Contraseña Inicial *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold mb-1">Créditos Iniciales</label>
                  <input
                    type="number"
                    value={credits}
                    onChange={(e) => setCredits(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="flatRateCheck"
                    checked={isFlatRate}
                    onChange={(e) => setIsFlatRate(e.target.checked)}
                    className="rounded text-indigo-600 h-4 w-4"
                  />
                  <label htmlFor="flatRateCheck" className="text-xs font-semibold cursor-pointer">
                    Tarifa Plana
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {creating ? "Creando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Recarga de Créditos y Tarifa Plana */}
      {rechargeModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Gestionar Plan de {rechargeModalUser.name}
              </h3>
              <button
                type="button"
                onClick={() => setRechargeModalUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRechargeCredits} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs space-y-1">
                <p>
                  <strong>Usuario:</strong> {rechargeModalUser.email}
                </p>
                <p>
                  <strong>Saldo actual:</strong> {rechargeModalUser.credits} créditos
                </p>
                <p>
                  <strong>Modalidad actual:</strong>{" "}
                  {rechargeModalUser.isFlatRate ? "Tarifa Plana" : "Por Créditos"}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Puntos / Créditos a añadir (+)
                </label>
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">Activar Tarifa Plana Ilimitada</span>
                  <span className="text-[11px] text-slate-400 block">
                    El usuario podrá generar presupuestos sin límite de créditos
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={flatRateToggle}
                  onChange={(e) => setFlatRateToggle(e.target.checked)}
                  className="rounded text-indigo-600 h-5 w-5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Nota o Motivo (Opcional)</label>
                <input
                  type="text"
                  value={rechargeNotes}
                  onChange={(e) => setRechargeNotes(e.target.value)}
                  placeholder="Ej: Pago de cuota mensual / Recarga bono 20 presupuestos"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRechargeModalUser(null)}
                  className="px-4 py-2 text-xs rounded-xl text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={recharging}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {recharging ? "Actualizando..." : "Aplicar Recarga"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
