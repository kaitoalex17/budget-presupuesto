export type UserRole = "ADMIN" | "USER";

export type BudgetStatus =
  | "BORRADOR"
  | "ENVIADO"
  | "VISTO"
  | "ACEPTADO"
  | "RECHAZADO"
  | "FACTURADO";

export type ItemType = "UNIDAD" | "PARTIDA";

export interface BudgetItemInput {
  id?: string;
  type: ItemType;
  concept: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  order: number;
}

export interface PaymentInstallment {
  title: string;
  percentage: number;
  amount: number;
  dueDateDescription?: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  credits: number;
  isFlatRate: boolean;
  companyName?: string | null;
  logo?: string | null;
}
