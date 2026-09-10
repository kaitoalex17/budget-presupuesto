import React from "react";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { BudgetsClient } from "./BudgetsClient";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const budgets = await prisma.budget.findMany({
    where: { userId: user.userId },
    include: {
      client: true,
      items: true,
      invoice: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <BudgetsClient
      initialBudgets={budgets}
      companyName={user.companyName}
      credits={user.credits}
      isFlatRate={user.isFlatRate}
    />
  );
}
