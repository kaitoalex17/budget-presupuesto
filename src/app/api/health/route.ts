import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ensureDatabaseInitialized } from "@/lib/initDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Asegurar que las tablas existan automáticamente
    await ensureDatabaseInitialized();
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: "ok",
      userCount,
      timestamp: new Date().toISOString(),
      service: "budget-presupuesto",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { status: "error", message: "Database check failure", error: message },
      { status: 500 }
    );
  }
}
