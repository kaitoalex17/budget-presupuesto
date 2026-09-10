import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const concepts = await prisma.savedConcept.findMany({
      where: { userId: user.userId },
      orderBy: { title: "asc" },
    });

    return NextResponse.json(concepts);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener conceptos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { title, description, defaultPrice, type } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    const newConcept = await prisma.savedConcept.create({
      data: {
        userId: user.userId,
        title,
        description: description || null,
        defaultPrice: Number(defaultPrice) || 0,
        type: type || "UNIDAD",
      },
    });

    return NextResponse.json(newConcept);
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar concepto" }, { status: 500 });
  }
}
