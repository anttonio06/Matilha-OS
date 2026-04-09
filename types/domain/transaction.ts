// ─── Financial Domain Types ───────────────────────────────────────────────────

import type { ServiceType } from "./appointment";

export type PaymentStatus = "pago" | "pendente" | "atrasado" | "cancelado";
export type PaymentMethod = "pix" | "cartao_credito" | "cartao_debito" | "dinheiro" | "plano";
export type TransactionType = "receita" | "despesa";
export type TransactionCategory = ServiceType | "produto" | "outros";

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  tutorId?: string;
  dogId?: string;
  appointmentId?: string;
  dueDate: string;            // ISO date
  paidAt?: string;            // ISO date
  createdAt: string;
}
