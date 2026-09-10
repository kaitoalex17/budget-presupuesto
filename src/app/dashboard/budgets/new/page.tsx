import React from "react";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { BudgetForm } from "../BudgetForm";

export const dynamic = "force-dynamic";

export default async function NewBudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { clientId } = await searchParams;

  const [clients, savedConcepts, dbUser] = await Promise.all([
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

  return (
    <BudgetForm
      clients={clients}
      savedConcepts={savedConcepts}
      settings={dbUser?.settings || null}
      selectedClientId={clientId}
      userCredits={dbUser?.credits ?? 0}
      isFlatRate={dbUser?.isFlatRate ?? false}
    />
  );
}
