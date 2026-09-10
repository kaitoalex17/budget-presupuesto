import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Verificar conexión con la base de datos
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
