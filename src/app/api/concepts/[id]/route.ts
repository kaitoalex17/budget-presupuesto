import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const { title, description, defaultPrice, type } = await req.json();

    const updated = await prisma.savedConcept.updateMany({
      where: { id, userId: user.userId },
      data: {
        title,
        description: description || null,
        defaultPrice: Number(defaultPrice) || 0,
        type: type || "UNIDAD",
      },
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar concepto" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    await prisma.savedConcept.deleteMany({
      where: { id, userId: user.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar concepto" }, { status: 500 });
  }
}
