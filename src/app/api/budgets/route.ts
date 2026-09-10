import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const whereClause: Record<string, unknown> = { userId: user.userId };
    if (status && status !== "ALL") {
      whereClause.status = status;
    }
    if (search) {
      whereClause.OR = [
        { budgetNumber: { contains: search } },
        { title: { contains: search } },
        { client: { name: { contains: search } } },
        { client: { company: { contains: search } } },
      ];
    }

    const budgets = await prisma.budget.findMany({
      where: whereClause,
      include: {
        client: true,
        items: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error("Error al obtener presupuestos:", error);
    return NextResponse.json({ error: "Error al obtener presupuestos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // 1. Validar créditos disponibles
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { settings: true },
    });

    if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    if (!dbUser.isFlatRate && dbUser.credits <= 0) {
      return NextResponse.json(
        {
          error:
            "No dispones de créditos para generar nuevos presupuestos. Contacta con el administrador para una recarga.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      clientId,
      budgetNumber,
      title,
      issueDate,
      validUntil,
      applyTax = true,
      taxRate = 21,
      irpfRate = 0,
      discount = 0,
      paymentMethod,
      paymentTerms,
      legalTerms,
      items,
      saveToCatalog, // Array de items que el usuario marcó para guardar en su catálogo
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "El título o proyecto del presupuesto es obligatorio." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Debes incluir al menos una partida o concepto en el presupuesto." },
        { status: 400 }
      );
    }

    // Calcular totales
    let subtotal = 0;
    const computedItems = items.map((it: {
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
    });

    const disc = Number(discount) || 0;
    const taxableBase = Math.max(0, subtotal - disc);
    const taxAmount = applyTax ? (taxableBase * (Number(taxRate) || 0)) / 100 : 0;
    const irpfAmount = (Number(irpfRate) || 0) > 0 ? (taxableBase * Number(irpfRate)) / 100 : 0;
    const total = taxableBase + taxAmount - irpfAmount;

    // Token público único para el cliente
    const publicToken = crypto.randomBytes(16).toString("hex");

    // Crear presupuesto en transacción
    const createdBudget = await prisma.$transaction(async (tx) => {
      // Deducir 1 crédito si no es tarifa plana
      if (!dbUser.isFlatRate) {
        await tx.user.update({
          where: { id: user.userId },
          data: { credits: { decrement: 1 } },
        });

        await tx.creditTransaction.create({
          data: {
            userId: user.userId,
            amount: -1,
            type: "CONSUMO",
            notes: `Creación de presupuesto ${budgetNumber || "nuevo"}`,
          },
        });
      }

      // Incrementar secuencia en settings
      if (dbUser.settings) {
        await tx.profileSettings.update({
          where: { userId: user.userId },
          data: { nextBudgetSeq: { increment: 1 } },
        });
      }

      // Crear presupuesto con partidas
      const budget = await tx.budget.create({
        data: {
          userId: user.userId,
          clientId: clientId || null,
          budgetNumber:
            budgetNumber ||
            `${dbUser.settings?.budgetPrefix || "PRES-"}${String(
              dbUser.settings?.nextBudgetSeq || 1
            ).padStart(4, "0")}`,
          title,
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          validUntil: validUntil
            ? new Date(validUntil)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "BORRADOR",
          publicToken,
          subtotal,
          applyTax: Boolean(applyTax),
          taxRate: Number(taxRate) || 0,
          taxAmount,
          irpfRate: Number(irpfRate) || 0,
          irpfAmount,
          discount: disc,
          total,
          paymentMethod: paymentMethod || dbUser.settings?.defaultPaymentMethod || "TRANSFERENCIA",
          paymentTerms: typeof paymentTerms === "string" ? paymentTerms : JSON.stringify(paymentTerms),
          legalTerms: legalTerms || dbUser.settings?.defaultLegalTerms || null,
          items: {
            create: computedItems,
          },
        },
        include: {
          items: true,
          client: true,
        },
      });

      // Guardar conceptos en catálogo si se seleccionaron
      if (Array.isArray(saveToCatalog) && saveToCatalog.length > 0) {
        for (const catItem of saveToCatalog) {
          await tx.savedConcept.create({
            data: {
              userId: user.userId,
              title: catItem.concept,
              description: catItem.description || null,
              defaultPrice: Number(catItem.unitPrice) || Number(catItem.amount) || 0,
              type: catItem.type || "UNIDAD",
            },
          });
        }
      }

      return budget;
    });

    return NextResponse.json(createdBudget);
  } catch (error) {
    console.error("Error al crear presupuesto:", error);
    return NextResponse.json({ error: "Error al guardar el presupuesto" }, { status: 500 });
  }
}
