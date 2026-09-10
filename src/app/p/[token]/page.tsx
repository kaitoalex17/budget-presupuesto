import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { PublicBudgetView } from "./PublicBudgetView";

export default async function PublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const budget = await prisma.budget.findUnique({
    where: { publicToken: token },
    include: {
      client: true,
      items: { orderBy: { order: "asc" } },
      user: {
        select: {
          name: true,
          companyName: true,
          nif: true,
          phone: true,
          email: true,
          address: true,
          logo: true,
          settings: true,
        },
      },
    },
  });

  if (!budget) {
    notFound();
  }

  // Marcar como VISTO si estaba en BORRADOR o ENVIADO
  if (budget.status === "ENVIADO" || budget.status === "BORRADOR") {
    await prisma.budget.update({
      where: { id: budget.id },
      data: { status: "VISTO" },
    });
    budget.status = "VISTO";
  }

  return <PublicBudgetView initialBudget={budget} token={token} />;
}
