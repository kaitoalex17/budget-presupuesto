import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { BudgetForm } from "../../BudgetForm";

export const dynamic = "force-dynamic";

export default async function EditBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;

  const [budget, clients, savedConcepts, dbUser] = await Promise.all([
    prisma.budget.findFirst({
      where: { id, userId: user.userId },
      include: { items: { orderBy: { order: "asc" } } },
    }),
    prisma.client.findMany({
      where: { userId: user.userId },
      select: { id: true, name: true, company: true },
      orderBy: { name: "asc" },
    }),
    prisma.savedConcept.findMany({
      where: { userId: user.userId },
      orderBy: { title: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: user.userId },
      include: { settings: true },
    }),
  ]);

  if (!budget) {
    notFound();
  }

  return (
    <BudgetForm
      initialData={budget}
      clients={clients}
      savedConcepts={savedConcepts}
      settings={dbUser?.settings || null}
      userCredits={dbUser?.credits ?? 0}
      isFlatRate={dbUser?.isFlatRate ?? false}
    />
  );
}
