import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
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
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    // Si el estado era BORRADOR o ENVIADO, actualizar a VISTO para que el emisor sepa que el cliente lo abrió
    if (budget.status === "ENVIADO" || budget.status === "BORRADOR") {
      await prisma.budget.update({
        where: { id: budget.id },
        data: { status: "VISTO" },
      });
      budget.status = "VISTO";
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Error obteniendo presupuesto público:", error);
    return NextResponse.json({ error: "Error al cargar el presupuesto" }, { status: 500 });
  }
}

// Firmar y Aceptar Presupuesto
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { signerName, signatureImage } = await req.json();

    if (!signerName || !signatureImage) {
      return NextResponse.json(
        { error: "El nombre del firmante y la firma digital son obligatorios." },
        { status: 400 }
      );
    }

    const budget = await prisma.budget.findUnique({
      where: { publicToken: token },
    });

    if (!budget) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    if (budget.status === "ACEPTADO" || budget.status === "FACTURADO") {
      return NextResponse.json(
        { error: "Este presupuesto ya fue aceptado y firmado previamente." },
        { status: 400 }
      );
    }

    const updated = await prisma.budget.update({
      where: { id: budget.id },
      data: {
        status: "ACEPTADO",
        signerName,
        signatureImage,
        signedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, budget: updated });
  } catch (error) {
    console.error("Error firmando presupuesto:", error);
    return NextResponse.json({ error: "Error al registrar la firma digital" }, { status: 500 });
  }
}

// Enviar comentarios o dudas
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { clientNotes } = await req.json();

    const budget = await prisma.budget.findUnique({
      where: { publicToken: token },
    });

    if (!budget) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    await prisma.budget.update({
      where: { id: budget.id },
      data: { clientNotes },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar comentarios" }, { status: 500 });
  }
}
