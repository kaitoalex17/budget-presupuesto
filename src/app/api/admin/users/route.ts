import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            budgets: true,
            clients: true,
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const sanitized = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      companyName: u.companyName,
      role: u.role,
      credits: u.credits,
      isFlatRate: u.isFlatRate,
      isActive: u.isActive,
      phone: u.phone,
      createdAt: u.createdAt,
      budgetCount: u._count.budgets,
      clientCount: u._count.clients,
      invoiceCount: u._count.invoices,
    }));

    return NextResponse.json(sanitized);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { email, password, name, companyName, phone, credits = 10, isFlatRate = false } =
      await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, contraseña y nombre son campos requeridos." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este correo electrónico." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name,
        companyName: companyName || null,
        phone: phone || null,
        role: "USER",
        credits: Number(credits) || 0,
        isFlatRate: Boolean(isFlatRate),
        settings: {
          create: {
            budgetPrefix: "PRES-",
            nextBudgetSeq: 1,
            invoicePrefix: "FAC-",
            nextInvoiceSeq: 1,
            defaultValidityDays: 30,
            defaultPaymentMethod: "TRANSFERENCIA",
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        credits: newUser.credits,
        isFlatRate: newUser.isFlatRate,
      },
    });
  } catch (error) {
    console.error("Error al crear usuario por admin:", error);
    return NextResponse.json({ error: "Error al registrar el usuario SaaS" }, { status: 500 });
  }
}
