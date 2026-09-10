import prisma from "./db";
import bcrypt from "bcryptjs";

let isDbInitialized = false;

export async function ensureDatabaseInitialized() {
  if (isDbInitialized) return;

  try {
    // 1. Crear tablas PostgreSQL si no existen
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT UNIQUE NOT NULL,
        "password" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'USER',
        "name" TEXT NOT NULL,
        "companyName" TEXT,
        "nif" TEXT,
        "phone" TEXT,
        "address" TEXT,
        "logo" TEXT,
        "credits" INTEGER NOT NULL DEFAULT 10,
        "isFlatRate" BOOLEAN NOT NULL DEFAULT false,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProfileSettings" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "budgetPrefix" TEXT NOT NULL DEFAULT 'PRES-',
        "nextBudgetSeq" INTEGER NOT NULL DEFAULT 1,
        "invoicePrefix" TEXT NOT NULL DEFAULT 'FAC-',
        "nextInvoiceSeq" INTEGER NOT NULL DEFAULT 1,
        "defaultValidityDays" INTEGER NOT NULL DEFAULT 30,
        "defaultPaymentMethod" TEXT NOT NULL DEFAULT 'TRANSFERENCIA',
        "bankName" TEXT,
        "bankAccountIban" TEXT,
        "bankAccountHolder" TEXT,
        "defaultPaymentTerms" TEXT,
        "defaultLegalTerms" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Client" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "company" TEXT,
        "nif" TEXT,
        "email" TEXT,
        "phone" TEXT,
        "address" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Budget" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "clientId" TEXT REFERENCES "Client"("id") ON DELETE SET NULL,
        "budgetNumber" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "validUntil" TIMESTAMP(3) NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'BORRADOR',
        "publicToken" TEXT UNIQUE NOT NULL,
        "tokenExpiresAt" TIMESTAMP(3),
        "currency" TEXT NOT NULL DEFAULT 'EUR',
        "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "applyTax" BOOLEAN NOT NULL DEFAULT true,
        "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 21.0,
        "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "irpfRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "irpfAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "paymentMethod" TEXT,
        "paymentTerms" TEXT,
        "legalTerms" TEXT,
        "clientNotes" TEXT,
        "signedAt" TIMESTAMP(3),
        "signerName" TEXT,
        "signatureImage" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BudgetItem" (
        "id" TEXT PRIMARY KEY,
        "budgetId" TEXT NOT NULL REFERENCES "Budget"("id") ON DELETE CASCADE,
        "type" TEXT NOT NULL DEFAULT 'UNIDAD',
        "concept" TEXT NOT NULL,
        "description" TEXT,
        "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
        "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "order" INTEGER NOT NULL DEFAULT 0
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SavedConcept" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "defaultPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "type" TEXT NOT NULL DEFAULT 'UNIDAD',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Invoice" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "budgetId" TEXT UNIQUE REFERENCES "Budget"("id") ON DELETE SET NULL,
        "clientId" TEXT REFERENCES "Client"("id") ON DELETE SET NULL,
        "invoiceNumber" TEXT NOT NULL,
        "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dueDate" TIMESTAMP(3),
        "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 21.0,
        "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "irpfRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "irpfAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'EMITIDA',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CreditTransaction" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "adminId" TEXT,
        "amount" INTEGER NOT NULL,
        "type" TEXT NOT NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Sembrar Admin si no existe
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
      console.log("✅ Admin auto-inicializado:", admin.email);
    }

    // 3. Sembrar Demo User si no existe
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
            },
          },
        },
      });
      console.log("✅ Usuario Demo auto-inicializado:", demoUser.email);
    }

    isDbInitialized = true;
    return { success: true };
  } catch (err) {
    console.error("Error al auto-inicializar base de datos:", err);
    throw err;
  }
}
