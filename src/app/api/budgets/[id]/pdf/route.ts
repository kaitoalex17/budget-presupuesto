import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateBudgetPdf } from "@/lib/pdf/budgetPdfGenerator";

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
        user: { include: { settings: true } },
      },
    });

    if (!budget) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    const doc = generateBudgetPdf({
      budgetNumber: budget.budgetNumber,
      title: budget.title,
      issueDate: new Date(budget.issueDate).toLocaleDateString("es-ES"),
      validUntil: new Date(budget.validUntil).toLocaleDateString("es-ES"),
      status: budget.status,
      issuer: {
        name: budget.user.name,
        companyName: budget.user.companyName,
        nif: budget.user.nif,
        phone: budget.user.phone,
        email: budget.user.email,
        address: budget.user.address,
        logo: budget.user.logo,
      },
      client: budget.client
        ? {
            name: budget.client.name,
            company: budget.client.company,
            nif: budget.client.nif,
            phone: budget.client.phone,
            email: budget.client.email,
            address: budget.client.address,
          }
        : null,
      items: budget.items.map((i) => ({
        concept: i.concept,
        description: i.description,
        type: i.type,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        amount: i.amount,
      })),
      subtotal: budget.subtotal,
      applyTax: budget.applyTax,
      taxRate: budget.taxRate,
      taxAmount: budget.taxAmount,
      irpfRate: budget.irpfRate,
      irpfAmount: budget.irpfAmount,
      discount: budget.discount,
      total: budget.total,
      currency: budget.currency,
      paymentMethod: budget.paymentMethod,
      bankInfo: {
        bankName: budget.user.settings?.bankName,
        iban: budget.user.settings?.bankAccountIban,
        holder: budget.user.settings?.bankAccountHolder,
      },
      paymentTerms: budget.paymentTerms,
      legalTerms: budget.legalTerms,
      signature: budget.signatureImage
        ? {
            image: budget.signatureImage,
            signerName: budget.signerName,
            signedAt: budget.signedAt ? new Date(budget.signedAt).toLocaleString("es-ES") : null,
          }
        : null,
    });

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${budget.budgetNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generando PDF:", error);
    return NextResponse.json({ error: "Error al generar PDF" }, { status: 500 });
  }
}
