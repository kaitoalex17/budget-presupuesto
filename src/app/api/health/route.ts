import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ensureDatabaseInitialized } from "@/lib/initDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Asegurar que las tablas existan automáticamente
    await ensureDatabaseInitialized();
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "budget-presupuesto",
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Database connection failure", error: String(error) },
      { status: 500 }
    );
  }
}
