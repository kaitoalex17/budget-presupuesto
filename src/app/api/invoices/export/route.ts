import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateGestoriaCsv } from "@/lib/export/gestoriaExport";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const invoices = await prisma.invoice.findMany({
      where: { userId: user.userId },
      include: { client: true },
      orderBy: { invoiceNumber: "asc" },
    });

    const rows = invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      issueDate: new Date(inv.issueDate).toLocaleDateString("es-ES"),
      clientName: inv.client?.company || inv.client?.name || "Sin cliente",
      clientNif: inv.client?.nif || "",
      subtotal: inv.subtotal,
      taxRate: inv.taxRate,
      taxAmount: inv.taxAmount,
      irpfRate: inv.irpfRate,
      irpfAmount: inv.irpfAmount,
      total: inv.total,
      status: inv.status,
    }));

    const csvData = generateGestoriaCsv(rows);

    return new Response(csvData, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="libro_facturas_gestoria_${new Date().getFullYear()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error al exportar facturas:", error);
    return NextResponse.json({ error: "Error al exportar datos para la gestoría" }, { status: 500 });
  }
}
