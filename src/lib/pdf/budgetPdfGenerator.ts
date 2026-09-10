import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BudgetPdfData {
  budgetNumber: string;
  title: string;
  issueDate: string;
  validUntil: string;
  status: string;
  // Emisor
  issuer: {
    name: string;
    companyName?: string | null;
    nif?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    logo?: string | null;
  };
  // Cliente
  client?: {
    name: string;
    company?: string | null;
    nif?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  } | null;
  // Partidas
  items: Array<{
    concept: string;
    description?: string | null;
    type: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  // Totales
  subtotal: number;
  applyTax: boolean;
  taxRate: number;
  taxAmount: number;
  irpfRate: number;
  irpfAmount: number;
  discount: number;
  total: number;
  currency: string;
  // Pago y condiciones
  paymentMethod?: string | null;
  bankInfo?: {
    bankName?: string | null;
    iban?: string | null;
    holder?: string | null;
  } | null;
  paymentTerms?: string | null;
  legalTerms?: string | null;
  // Firma
  signature?: {
    image?: string | null;
    signerName?: string | null;
    signedAt?: string | null;
  } | null;
}

export function generateBudgetPdf(data: BudgetPdfData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = 15;

  // ==========================================
  // PÁGINA 1: PRESUPUESTO PRINCIPAL
  // ==========================================

  // 1. Encabezado: Logotipo o Nombre Comercial
  if (data.issuer.logo && data.issuer.logo.startsWith("data:image")) {
    try {
      doc.addImage(data.issuer.logo, "PNG", margin, currentY, 40, 18);
    } catch {
      // Si falla la imagen, mostrar texto
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text(data.issuer.companyName || data.issuer.name, margin, currentY + 8);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235); // Azul brand
    doc.text(data.issuer.companyName || data.issuer.name, margin, currentY + 6);
  }

  // Cuadro de Número de Presupuesto (Derecha)
  const boxWidth = 65;
  const boxX = pageWidth - margin - boxWidth;
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(boxX, currentY, boxWidth, 24, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text("PRESUPUESTO", boxX + 5, currentY + 7);

  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text(data.budgetNumber, boxX + 5, currentY + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Fecha: ${data.issueDate}`, boxX + 5, currentY + 19);
  doc.text(`Validez: ${data.validUntil}`, boxX + 5, currentY + 22.5);

  currentY += 28;

  // 2. Datos del Emisor y Datos del Cliente (en dos columnas)
  const colWidth = (pageWidth - margin * 2 - 10) / 2;

  // Columna Izquierda: Emisor
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("DATOS DEL EMISOR", margin, currentY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(data.issuer.companyName || data.issuer.name, margin, currentY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  let emisorY = currentY + 9.5;
  if (data.issuer.nif) {
    doc.text(`NIF/CIF: ${data.issuer.nif}`, margin, emisorY);
    emisorY += 4;
  }
  if (data.issuer.address) {
    doc.text(data.issuer.address, margin, emisorY, { maxWidth: colWidth });
    emisorY += 4;
  }
  if (data.issuer.phone) {
    doc.text(`Tel: ${data.issuer.phone}`, margin, emisorY);
    emisorY += 4;
  }
  if (data.issuer.email) {
    doc.text(`Email: ${data.issuer.email}`, margin, emisorY);
    emisorY += 4;
  }

  // Columna Derecha: Cliente
  const clientX = margin + colWidth + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("CLIENTE / DESTINATARIO", clientX, currentY);

  let clientY = currentY + 5;
  if (data.client) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(data.client.company || data.client.name, clientX, clientY);
    clientY += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    if (data.client.company && data.client.name) {
      doc.text(`Att: ${data.client.name}`, clientX, clientY);
      clientY += 4;
    }
    if (data.client.nif) {
      doc.text(`NIF/CIF: ${data.client.nif}`, clientX, clientY);
      clientY += 4;
    }
    if (data.client.address) {
      doc.text(data.client.address, clientX, clientY, { maxWidth: colWidth });
      clientY += 4;
    }
    if (data.client.phone) {
      doc.text(`Tel: ${data.client.phone}`, clientX, clientY);
      clientY += 4;
    }
    if (data.client.email) {
      doc.text(`Email: ${data.client.email}`, clientX, clientY);
      clientY += 4;
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("Cliente General / Sin asignar", clientX, clientY);
    clientY += 6;
  }

  currentY = Math.max(emisorY, clientY) + 4;

  // 3. Título / Objeto del Presupuesto
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 9, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(49, 46, 129);
  doc.text(`PROYECTO: ${data.title}`, margin + 4, currentY + 6);

  currentY += 13;

  // 4. Tabla de Partidas y Conceptos
  const tableRows = data.items.map((item, index) => [
    (index + 1).toString(),
    {
      content: `${item.concept}${item.description ? "\n" + item.description : ""}`,
      styles: { cellWidth: "auto" as const },
    },
    item.type === "PARTIDA" ? "Partida" : "Unidad",
    item.type === "PARTIDA" ? "-" : item.quantity.toString(),
    item.type === "PARTIDA" ? "-" : `${item.unitPrice.toFixed(2)} €`,
    `${item.amount.toFixed(2)} €`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["#", "Concepto / Descripción", "Tipo", "Cant.", "Precio Unit.", "Importe"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 22, halign: "right" },
      5: { cellWidth: 24, halign: "right", fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 6;

  // Si queda poco espacio para los totales y firma, pasar a nueva página o ajustar
  if (currentY > pageHeight - 75) {
    doc.addPage();
    currentY = 20;
  }

  // 5. Bloque de Totales y Desglose Financiero (Lado Derecho)
  const totalsWidth = 75;
  const totalsX = pageWidth - margin - totalsWidth;
  let totalsY = currentY;

  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Base Imponible / Subtotal:", totalsX, totalsY);
  doc.text(`${data.subtotal.toFixed(2)} €`, pageWidth - margin, totalsY, { align: "right" });
  totalsY += 4.5;

  // Descuento si existe
  if (data.discount > 0) {
    doc.text("Descuento aplicado:", totalsX, totalsY);
    doc.text(`-${data.discount.toFixed(2)} €`, pageWidth - margin, totalsY, { align: "right" });
    totalsY += 4.5;
  }

  // IVA
  if (data.applyTax) {
    doc.text(`IVA (${data.taxRate}%):`, totalsX, totalsY);
    doc.text(`${data.taxAmount.toFixed(2)} €`, pageWidth - margin, totalsY, { align: "right" });
    totalsY += 4.5;
  } else {
    doc.text("IVA:", totalsX, totalsY);
    doc.text("Exento / Sin IVA", pageWidth - margin, totalsY, { align: "right" });
    totalsY += 4.5;
  }

  // IRPF si existe
  if (data.irpfRate > 0) {
    doc.text(`Retención IRPF (-${data.irpfRate}%):`, totalsX, totalsY);
    doc.text(`-${data.irpfAmount.toFixed(2)} €`, pageWidth - margin, totalsY, { align: "right" });
    totalsY += 4.5;
  }

  // TOTAL CUADRO DESTACADO
  totalsY += 1;
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(totalsX - 3, totalsY - 3, totalsWidth + 3, 10, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL PRESUPUESTO:", totalsX, totalsY + 4);
  doc.text(`${data.total.toFixed(2)} €`, pageWidth - margin, totalsY + 4, { align: "right" });

  // 6. Formas de Pago y Fraccionamiento en Plazos (Lado Izquierdo de los Totales)
  const paymentX = margin;
  let paymentY = currentY;
  const paymentMaxW = colWidth + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("FORMA DE PAGO Y CONDICIONES", paymentX, paymentY);
  paymentY += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Método: ${data.paymentMethod || "Transferencia Bancaria"}`, paymentX, paymentY);
  paymentY += 4;

  if (data.bankInfo?.iban) {
    doc.text(`Cuenta / IBAN: ${data.bankInfo.iban}`, paymentX, paymentY);
    paymentY += 4;
    if (data.bankInfo.holder) {
      doc.text(`Titular: ${data.bankInfo.holder}`, paymentX, paymentY);
      paymentY += 4;
    }
  }

  // Plazos calculados (si están configurados)
  if (data.paymentTerms) {
    try {
      const installments = JSON.parse(data.paymentTerms);
      if (Array.isArray(installments) && installments.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Fraccionamiento de pago:", paymentX, paymentY);
        paymentY += 3.5;
        doc.setFont("helvetica", "normal");
        installments.forEach((inst: { title: string; amount?: number; percentage?: number }) => {
          const amountStr = inst.amount ? `${inst.amount.toFixed(2)} €` : "";
          doc.text(`• ${inst.title} ${amountStr ? `(${amountStr})` : ""}`, paymentX + 2, paymentY);
          paymentY += 3.5;
        });
      }
    } catch {
      doc.text(`Plazos: ${data.paymentTerms}`, paymentX, paymentY, { maxWidth: paymentMaxW });
      paymentY += 5;
    }
  }

  currentY = Math.max(totalsY + 12, paymentY + 6);

  // 7. Bloque de Firma Digital o Espacio de Aceptación
  const signatureBoxY = currentY;
  const signBoxWidth = 85;
  const signBoxX = pageWidth - margin - signBoxWidth;

  if (data.signature?.image) {
    // Presupuesto FIRMADO digitalmente
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(34, 197, 94);
    doc.roundedRect(signBoxX, signatureBoxY, signBoxWidth, 32, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52);
    doc.text("✓ PRESUPUESTO FIRMADO Y ACEPTADO", signBoxX + 4, signatureBoxY + 5);

    try {
      doc.addImage(data.signature.image, "PNG", signBoxX + 5, signatureBoxY + 7, 45, 16);
    } catch {
      doc.text("[Firma Digital Registrada]", signBoxX + 5, signatureBoxY + 14);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Firmante: ${data.signature.signerName || "Cliente"}`, signBoxX + 4, signatureBoxY + 25);
    if (data.signature.signedAt) {
      doc.text(`Fecha y hora: ${data.signature.signedAt}`, signBoxX + 4, signatureBoxY + 29);
    }
  } else {
    // Espacio para firmar manualmente
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(signBoxX, signatureBoxY, signBoxWidth, 26, 2, 2, "D");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Firma y sello de conformidad del cliente:", signBoxX + 4, signatureBoxY + 5);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(signBoxX + 5, signatureBoxY + 20, signBoxX + signBoxWidth - 5, signatureBoxY + 20);
    doc.setLineDashPattern([], 0);
  }

  // Nota de pie en página 1
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "* Las condiciones contractuales, garantías y notas legales se detallan en la Hoja 2 anexa.",
    margin,
    pageHeight - 10
  );

  // ==========================================
  // PÁGINA 2: CONDICIONES GENERALES Y ANEXO
  // ==========================================
  doc.addPage();

  let p2Y = 18;
  // Encabezado Hoja 2
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text("CONDICIONES GENERALES Y ANEXO CONTRACTUAL", margin, p2Y);

  p2Y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Anexo vinculante al Presupuesto Nº ${data.budgetNumber} | Proyecto: ${data.title}`,
    margin,
    p2Y
  );

  p2Y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, p2Y, pageWidth - margin, p2Y);
  p2Y += 8;

  // Texto legal de condiciones
  const termsText =
    data.legalTerms ||
    `1. VALIDEZ DE LA OFERTA: Este presupuesto tiene una validez de 30 días a partir de su emisión. Transcurrido dicho plazo, los precios y disponibilidades podrán ser revisados.
2. CONDICIONES DE PAGO: Los pagos se realizarán en los plazos y cuantías estipulados en la primera hoja. La demora en los pagos facultará al emisor para suspender los trabajos o entregas hasta la regularización de las cantidades adeudadas.
3. MODIFICACIONES Y TRABAJOS EXTRAORDINARIOS: Cualquier variación o ampliación sobre los conceptos descritos en este presupuesto será objeto de un presupuesto adicional por escrito y deberá ser formalmente aprobada por el cliente antes de su ejecución.
4. GARANTÍA: La garantía de los servicios e instalaciones suministradas se regirá por la normativa legal vigente, cubriendo defectos de ejecución y mano de obra a partir de la fecha de entrega y conformidad.
5. FUERZA MAYOR Y RETRASOS: El emisor no será responsable de retrasos derivados de causas ajenas a su control, tales como rotura de suministros por terceros, inclemencias meteorológicas o retrasos en licencias administrativas.
6. PROTECCIÓN DE DATOS: De conformidad con el RGPD, los datos personales facilitados serán tratados por el emisor para el cumplimiento y facturación del presente contrato. El cliente podrá ejercer sus derechos de acceso, rectificación y supresión ante la dirección de contacto indicada en el encabezado.`;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const splitTerms = doc.splitTextToSize(termsText, pageWidth - margin * 2);
  doc.text(splitTerms, margin, p2Y, { lineHeightFactor: 1.4 });

  // Pie de página en Hoja 2
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento generado por ${data.issuer.companyName || data.issuer.name} | Presupuesto ${data.budgetNumber}`,
    margin,
    pageHeight - 10
  );

  return doc;
}
