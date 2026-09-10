import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;

    const budget = await prisma.budget.findFirst({
      where: { id, userId: user.userId },
      include: { invoice: true },
    });

    if (!budget) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    if (budget.invoice) {
      return NextResponse.json(
        { error: "Este presupuesto ya ha sido convertido en factura previamente." },
        { status: 400 }
      );
    }

    // Obtener perfil y contador de facturas
    const settings = await prisma.profileSettings.findUnique({
      where: { userId: user.userId },
    });

    const prefix = settings?.invoicePrefix || "FAC-";
    const nextSeq = settings?.nextInvoiceSeq || 1;
    const invoiceNumber = `${prefix}${String(nextSeq).padStart(4, "0")}`;

    const invoice = await prisma.$transaction(async (tx) => {
      // Crear la factura
      const inv = await tx.invoice.create({
        data: {
          userId: user.userId,
          budgetId: budget.id,
          clientId: budget.clientId,
          invoiceNumber,
          issueDate: new Date(),
          subtotal: budget.subtotal,
          taxRate: budget.taxRate,
          taxAmount: budget.taxAmount,
          irpfRate: budget.irpfRate,
          irpfAmount: budget.irpfAmount,
          total: budget.total,
          status: "EMITIDA",
          notes: `Factura generada automáticamente a partir del Presupuesto ${budget.budgetNumber}`,
        },
      });

      // Actualizar estado del presupuesto a FACTURADO
      await tx.budget.update({
        where: { id: budget.id },
        data: { status: "FACTURADO" },
      });

      // Incrementar contador de factura en settings
      if (settings) {
        await tx.profileSettings.update({
          where: { userId: user.userId },
          data: { nextInvoiceSeq: { increment: 1 } },
        });
      }

      return inv;
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error al convertir en factura:", error);
    return NextResponse.json({ error: "Error al generar la factura" }, { status: 500 });
  }
}
