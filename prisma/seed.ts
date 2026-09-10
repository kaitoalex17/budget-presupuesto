import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de la base de datos...");

  // 1. Crear Usuario Administrador si no existe
  const adminEmail = "admin@presupuesto.local";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("AdminPassword2026!", 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: "Administrador del Sistema",
        role: "ADMIN",
        credits: 9999,
        isFlatRate: true,
        companyName: "Plataforma Presupuestos SaaS",
        settings: {
          create: {
            budgetPrefix: "ADM-",
            nextBudgetSeq: 1,
            invoicePrefix: "FAC-ADM-",
            nextInvoiceSeq: 1,
            defaultValidityDays: 30,
            defaultPaymentMethod: "TRANSFERENCIA",
          },
        },
      },
    });
    console.log("✅ Usuario Administrador creado:", admin.email);
  }

  // 2. Crear Usuario SaaS Demo si no existe
  const demoEmail = "demo@empresa.com";
  const existingDemo = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!existingDemo) {
    const hashedDemoPassword = await bcrypt.hash("DemoPassword2026!", 10);
    const demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        password: hashedDemoPassword,
        name: "Carlos Martínez",
        companyName: "Reformas y Construcciones Pro S.L.",
        nif: "B-12345678",
        phone: "+34 612 345 678",
        address: "Calle Gran Vía 42, 3º B, 28013 Madrid",
        role: "USER",
        credits: 15,
        isFlatRate: false,
        settings: {
          create: {
            budgetPrefix: "PRES-",
            nextBudgetSeq: 2,
            invoicePrefix: "FAC-",
            nextInvoiceSeq: 1,
            defaultValidityDays: 15,
            defaultPaymentMethod: "TRANSFERENCIA",
            bankName: "Banco Santander",
            bankAccountIban: "ES91 0049 1500 0512 3456 7890",
            bankAccountHolder: "Reformas y Construcciones Pro S.L.",
            defaultPaymentTerms: JSON.stringify([
              { title: "50% al aceptar el presupuesto e inicio de obra", percentage: 50 },
              { title: "50% a la entrega y conformidad de los trabajos", percentage: 50 },
            ]),
            defaultLegalTerms: `1. VALIDEZ: La presente oferta económica tiene una vigencia de 15 días naturales a partir de la fecha de emisión.
2. CONDICIONES DE PAGO: El importe se abonará según los plazos establecidos. No se iniciarán los trabajos sin el abono del primer plazo.
3. TRABAJOS ADICIONALES: Cualquier modificación o trabajo extra solicitado durante la ejecución que no esté expresamente contemplado en este documento será presupuestado por separado y requerirá aceptación previa.
4. GARANTÍA: Todos los trabajos ejecutados cuentan con una garantía de 2 años conforme a la legislación vigente de consumidores y usuarios.
5. PROTECCIÓN DE DATOS: Los datos de carácter personal facilitados serán tratados con la finalidad de gestionar la relación contractual y el servicio presupuestado.`,
          },
        },
      },
    });

    console.log("✅ Usuario Demo creado:", demoUser.email);

    // Conceptos guardados
    await prisma.savedConcept.createMany({
      data: [
        {
          userId: demoUser.id,
          title: "Demolición y desescombro a vertedero",
          description: "Retirada de alicatados, sanitarios existentes y transporte a punto limpio autorizado.",
          defaultPrice: 650.0,
          type: "PARTIDA",
        },
        {
          userId: demoUser.id,
          title: "Alicatado de paredes con gres porcelánico",
          description: "Colocación de plaqueta con mortero cola flexible C2TE y rejuntado hidrófugo.",
          defaultPrice: 32.5,
          type: "UNIDAD",
        },
        {
          userId: demoUser.id,
          title: "Instalación completa de fontanería para baño",
          description: "Tuberías multicapa para lavabo, inodoro y plato de ducha con llaves de corte individuales.",
          defaultPrice: 850.0,
          type: "PARTIDA",
        },
        {
          userId: demoUser.id,
          title: "Mano de obra oficial de 1ª (Horas)",
          description: "Trabajos de albañilería general y remates.",
          defaultPrice: 28.0,
          type: "UNIDAD",
        },
      ],
    });

    // Cliente demo
    const client = await prisma.client.create({
      data: {
        userId: demoUser.id,
        name: "María Gómez López",
        company: "Residencial Las Palmeras",
        nif: "52987654K",
        email: "maria.gomez@ejemplo.com",
        phone: "+34 689 987 654",
        address: "Av. de América 15, 4º A, Madrid",
        notes: "Interesada en reformar el baño principal. Prefiere acabados en tonos grises.",
      },
    });

    // Presupuesto demo inicial
    const budget = await prisma.budget.create({
      data: {
        userId: demoUser.id,
        clientId: client.id,
        budgetNumber: "PRES-0001",
        title: "Reforma Integral de Cuarto de Baño Principal",
        issueDate: new Date(),
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: "ENVIADO",
        publicToken: "demo-token-presupuesto-001",
        subtotal: 2450.0,
        applyTax: true,
        taxRate: 21.0,
        taxAmount: 514.5,
        irpfRate: 0,
        irpfAmount: 0,
        discount: 0,
        total: 2964.5,
        paymentMethod: "TRANSFERENCIA",
        paymentTerms: JSON.stringify([
          { title: "50% al aceptar e inicio de obra", percentage: 50, amount: 1482.25 },
          { title: "50% a la finalización", percentage: 50, amount: 1482.25 },
        ]),
        legalTerms: `1. VALIDEZ: 15 días naturales a partir de la emisión.
2. FORMA DE PAGO: 50% al inicio y 50% a la entrega de la obra.
3. GARANTÍA: 2 años en mano de obra e instalaciones.
4. CUALQUIER EXTRA: Será consultado y presupuestado previamente.`,
        items: {
          create: [
            {
              type: "PARTIDA",
              concept: "Demolición y retirada de escombros",
              description: "Picado de azulejos, retirada de bañera antigua y transporte a vertedero oficial.",
              quantity: 1,
              unitPrice: 550.0,
              amount: 550.0,
              order: 1,
            },
            {
              type: "PARTIDA",
              concept: "Instalación de fontanería y desagües",
              description: "Nueva red para lavabo, inodoro y plato de ducha en tubería multicapa.",
              quantity: 1,
              unitPrice: 750.0,
              amount: 750.0,
              order: 2,
            },
            {
              type: "UNIDAD",
              concept: "Alicatado y solado porcelánico",
              description: "Colocación de baldosas de 60x60 en paredes y suelo, incluye adhesivo flexible.",
              quantity: 24,
              unitPrice: 35.0,
              amount: 840.0,
              order: 3,
            },
            {
              type: "PARTIDA",
              concept: "Montaje de plato de ducha, mampara e inodoro",
              description: "Instalación de plato de resina de 120x80, grifería empotrada y mampara fija.",
              quantity: 1,
              unitPrice: 310.0,
              amount: 310.0,
              order: 4,
            },
          ],
        },
      },
    });

    console.log("✅ Presupuesto Demo creado:", budget.budgetNumber);
  }

  console.log("Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
