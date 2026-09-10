import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const budget = await prisma.budget.findFirst({
      where: { id, userId: user.userId },
      include: {
        client: true,
        items: { orderBy: { order: "asc" } },
      },
    });

    if (!budget) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    return NextResponse.json(budget);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener el presupuesto" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const {
      clientId,
      title,
      status,
      issueDate,
      validUntil,
      applyTax,
      taxRate,
      irpfRate,
      discount,
      paymentMethod,
      paymentTerms,
      legalTerms,
      items,
    } = body;

    // Verificar existencia
    const existing = await prisma.budget.findFirst({
      where: { id, userId: user.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    let subtotal = 0;
    const computedItems = Array.isArray(items)
      ? items.map((it: {
          type: string;
          concept: string;
          description?: string;
          quantity: number;
          unitPrice: number;
          amount?: number;
        }, idx: number) => {
          const qty = Number(it.quantity) || 1;
          const price = Number(it.unitPrice) || 0;
          const amount = it.type === "PARTIDA" && it.amount ? Number(it.amount) : qty * price;
          subtotal += amount;
          return {
            type: it.type || "UNIDAD",
            concept: it.concept,
            description: it.description || null,
            quantity: qty,
            unitPrice: price,
            amount,
            order: idx + 1,
          };
        })
      : [];

    const disc = Number(discount) || 0;
    const taxableBase = Math.max(0, subtotal - disc);
    const taxAmount = applyTax ? (taxableBase * (Number(taxRate) || 0)) / 100 : 0;
    const irpfAmount = (Number(irpfRate) || 0) > 0 ? (taxableBase * Number(irpfRate)) / 100 : 0;
    const total = taxableBase + taxAmount - irpfAmount;

    await prisma.$transaction(async (tx) => {
      // Si se enviaron items, reemplazar partidas
      if (computedItems.length > 0) {
        await tx.budgetItem.deleteMany({ where: { budgetId: id } });
        await tx.budgetItem.createMany({
          data: computedItems.map((item) => ({
            ...item,
            budgetId: id,
          })),
        });
      }

      await tx.budget.update({
        where: { id },
        data: {
          clientId: clientId !== undefined ? clientId : existing.clientId,
          title: title || existing.title,
          status: status || existing.status,
          issueDate: issueDate ? new Date(issueDate) : existing.issueDate,
          validUntil: validUntil ? new Date(validUntil) : existing.validUntil,
          subtotal: computedItems.length > 0 ? subtotal : existing.subtotal,
          applyTax: applyTax !== undefined ? Boolean(applyTax) : existing.applyTax,
          taxRate: taxRate !== undefined ? Number(taxRate) : existing.taxRate,
          taxAmount: computedItems.length > 0 ? taxAmount : existing.taxAmount,
          irpfRate: irpfRate !== undefined ? Number(irpfRate) : existing.irpfRate,
          irpfAmount: computedItems.length > 0 ? irpfAmount : existing.irpfAmount,
          discount: disc !== undefined ? disc : existing.discount,
          total: computedItems.length > 0 ? total : existing.total,
          paymentMethod: paymentMethod !== undefined ? paymentMethod : existing.paymentMethod,
          paymentTerms:
            paymentTerms !== undefined
              ? typeof paymentTerms === "string"
                ? paymentTerms
                : JSON.stringify(paymentTerms)
              : existing.paymentTerms,
          legalTerms: legalTerms !== undefined ? legalTerms : existing.legalTerms,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al actualizar presupuesto:", error);
    return NextResponse.json({ error: "Error al actualizar presupuesto" }, { status: 500 });
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
    await prisma.budget.deleteMany({
      where: { id, userId: user.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar presupuesto" }, { status: 500 });
  }
}
