// ─── Plan & Subscription Domain Types ────────────────────────────────────────

import type { ServiceType } from "./appointment";

export type PlanCategory = "creche" | "banho" | "combo" | "hotel" | "escola" | "avulso";
export type PlanStatus   = "ativo" | "expirado" | "cancelado" | "pausado" | "trial";

export interface PlanServiceDiscount {
  type: ServiceType;
  discount: number;           // percentage 0–100
}

export interface Plan {
  id: string;
  name: string;
  category: PlanCategory;
  totalUses?: number;         // undefined = unlimited
  usedUses?: number;
  validFrom: string;          // ISO date
  validUntil: string;         // ISO date
  price: number;
  recurrent: boolean;
  status: PlanStatus;
  tutorId: string;
  dogId: string;
  includedServices: ServiceType[];
  discountedServices?: PlanServiceDiscount[];
  notes?: string;
}
