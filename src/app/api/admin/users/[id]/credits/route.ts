import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const { rechargeAmount, setFlatRate, notes } = await req.json();

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const amountToAdd = Number(rechargeAmount) || 0;
    const newFlatRate = setFlatRate !== undefined ? Boolean(setFlatRate) : targetUser.isFlatRate;
    const newCredits = Math.max(0, targetUser.credits + amountToAdd);

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          credits: newCredits,
          isFlatRate: newFlatRate,
        },
      }),
      prisma.creditTransaction.create({
        data: {
          userId: id,
          adminId: admin.userId,
          amount: amountToAdd,
          type:
            newFlatRate !== targetUser.isFlatRate
              ? newFlatRate
                ? "TARIFA_PLANA_ACTIVA"
                : "TARIFA_PLANA_DESACTIVA"
              : "RECARGA",
          notes: notes || `Recarga administrativa de ${amountToAdd} créditos`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      credits: newCredits,
      isFlatRate: newFlatRate,
    });
  } catch (error) {
    console.error("Error recargando créditos:", error);
    return NextResponse.json({ error: "Error al gestionar créditos" }, { status: 500 });
  }
}
