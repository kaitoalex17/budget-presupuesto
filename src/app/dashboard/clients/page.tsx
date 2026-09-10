import React from "react";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ClientsClient } from "./ClientsClient";

export default async function ClientsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const clients = await prisma.client.findMany({
    where: { userId: user.userId },
    include: {
      budgets: {
        select: {
          id: true,
          status: true,
          total: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <ClientsClient initialClients={clients} />;
}
