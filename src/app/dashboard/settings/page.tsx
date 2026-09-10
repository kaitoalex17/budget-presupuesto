import React from "react";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    include: { settings: true },
  });

  if (!dbUser) return null;

  return <SettingsClient user={dbUser} settings={dbUser.settings} />;
}
