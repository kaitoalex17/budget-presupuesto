interface InvoiceExportRow {
  invoiceNumber: string;
  issueDate: string;
  clientName: string;
  clientNif: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  irpfRate: number;
  irpfAmount: number;
  total: number;
  status: string;
}

/**
 * Genera un archivo CSV con formato contable oficial para gestorías.
 * Incluye el BOM de UTF-8 (\uFEFF) para que Microsoft Excel lo abra perfectamente con acentos y símbolos sin desconfigurar.
 */
export function generateGestoriaCsv(invoices: InvoiceExportRow[]): string {
  const headers = [
    "Número Factura",
    "Fecha Emisión",
    "Cliente",
    "NIF / CIF Cliente",
    "Base Imponible (€)",
    "% IVA",
    "Cuota IVA (€)",
    "% IRPF",
    "Retención IRPF (€)",
    "Total (€)",
    "Estado",
  ];

  const rows = invoices.map((inv) => [
    `"${inv.invoiceNumber}"`,
    `"${inv.issueDate}"`,
    `"${inv.clientName.replace(/"/g, '""')}"`,
    `"${inv.clientNif || ""}"`,
    inv.subtotal.toFixed(2).replace(".", ","),
    inv.taxRate.toFixed(2).replace(".", ","),
    inv.taxAmount.toFixed(2).replace(".", ","),
    inv.irpfRate.toFixed(2).replace(".", ","),
    inv.irpfAmount.toFixed(2).replace(".", ","),
    inv.total.toFixed(2).replace(".", ","),
    `"${inv.status}"`,
  ]);

  const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

  return "\uFEFF" + csvContent; // UTF-8 BOM para compatibilidad con Excel
}
