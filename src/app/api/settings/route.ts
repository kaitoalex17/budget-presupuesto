import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { settings: true },
    });

    if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    return NextResponse.json({
      name: dbUser.name,
      email: dbUser.email,
      companyName: dbUser.companyName,
      nif: dbUser.nif,
      phone: dbUser.phone,
      address: dbUser.address,
      logo: dbUser.logo,
      credits: dbUser.credits,
      isFlatRate: dbUser.isFlatRate,
      settings: dbUser.settings,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const {
      name,
      companyName,
      nif,
      phone,
      address,
      logo,
      budgetPrefix,
      nextBudgetSeq,
      defaultValidityDays,
      defaultPaymentMethod,
      bankName,
      bankAccountIban,
      bankAccountHolder,
      defaultPaymentTerms,
      defaultLegalTerms,
    } = body;

    // Actualizar datos del usuario
    await prisma.user.update({
      where: { id: user.userId },
      data: {
        name,
        companyName: companyName || null,
        nif: nif || null,
        phone: phone || null,
        address: address || null,
        logo: logo !== undefined ? logo : undefined,
      },
    });

    // Actualizar o crear settings
    await prisma.profileSettings.upsert({
      where: { userId: user.userId },
      create: {
        userId: user.userId,
        budgetPrefix: budgetPrefix || "PRES-",
        nextBudgetSeq: Number(nextBudgetSeq) || 1,
        defaultValidityDays: Number(defaultValidityDays) || 30,
        defaultPaymentMethod: defaultPaymentMethod || "TRANSFERENCIA",
        bankName: bankName || null,
        bankAccountIban: bankAccountIban || null,
        bankAccountHolder: bankAccountHolder || null,
        defaultPaymentTerms: defaultPaymentTerms || null,
        defaultLegalTerms: defaultLegalTerms || null,
      },
      update: {
        budgetPrefix: budgetPrefix || "PRES-",
        nextBudgetSeq: Number(nextBudgetSeq) || 1,
        defaultValidityDays: Number(defaultValidityDays) || 30,
        defaultPaymentMethod: defaultPaymentMethod || "TRANSFERENCIA",
        bankName: bankName || null,
        bankAccountIban: bankAccountIban || null,
        bankAccountHolder: bankAccountHolder || null,
        defaultPaymentTerms: defaultPaymentTerms || null,
        defaultLegalTerms: defaultLegalTerms || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    return NextResponse.json({ error: "Error al actualizar perfil y ajustes" }, { status: 500 });
  }
}
