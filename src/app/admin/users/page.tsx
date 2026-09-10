import React from "react";
import prisma from "@/lib/db";
import { AdminUsersClient } from "./AdminUsersClient";

export default async function AdminUsersPage() {
  const [users, transactions] = await Promise.all([
    prisma.user.findMany({
      include: {
        _count: {
          select: {
            budgets: true,
            clients: true,
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.creditTransaction.findMany({
      take: 15,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const sanitizedUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    companyName: u.companyName,
    role: u.role,
    credits: u.credits,
    isFlatRate: u.isFlatRate,
    isActive: u.isActive,
    phone: u.phone,
    createdAt: u.createdAt.toISOString(),
    budgetCount: u._count.budgets,
    clientCount: u._count.clients,
    invoiceCount: u._count.invoices,
  }));

  const sanitizedTransactions = transactions.map((t) => ({
    id: t.id,
    userEmail: t.user.email,
    userName: t.user.name,
    amount: t.amount,
    type: t.type,
    notes: t.notes,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <AdminUsersClient
      initialUsers={sanitizedUsers}
      initialTransactions={sanitizedTransactions}
    />
  );
}
