import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateBudgetWithAI } from "@/lib/ai/aiBudgetService";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json(
        { error: "La descripción del proyecto es obligatoria." },
        { status: 400 }
      );
    }

    const response = await generateBudgetWithAI({ prompt });
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error en AI generate:", error);
    return NextResponse.json(
      { error: "Error al generar partidas con IA" },
      { status: 500 }
    );
  }
}
