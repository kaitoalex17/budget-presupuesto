import React from "react";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ConceptsClient } from "./ConceptsClient";

export const dynamic = "force-dynamic";

export default async function ConceptsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const concepts = await prisma.savedConcept.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "desc" },
  });

  return <ConceptsClient initialConcepts={concepts} />;
}
