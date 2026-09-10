import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const clients = await prisma.client.findMany({
      where: { userId: user.userId },
      include: {
        _count: {
          select: { budgets: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { name, company, nif, email, phone, address, notes } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "El nombre o contacto del cliente es obligatorio" },
        { status: 400 }
      );
    }

    const newClient = await prisma.client.create({
      data: {
        userId: user.userId,
        name,
        company: company || null,
        nif: nif || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(newClient);
  } catch (error) {
    return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 });
  }
}
