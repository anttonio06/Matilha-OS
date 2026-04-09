// ─── Daycare (Creche) Domain Types ───────────────────────────────────────────

import type { DogSize, EnergyLevel } from "./dog";

export type DaycareSessionStatus = "presente" | "falta" | "cancelado";

export interface DaycareGroup {
  id: string;
  name: string;
  sizeRange: DogSize[];
  energyRange: EnergyLevel[];
  capacity: number;
  currentCount: number;
  monitorId?: string;
  space?: string;
  color: string;
}

export interface DaycareSession {
  id: string;
  dogId: string;
  tutorId: string;
  date: string;
  groupId: string;
  status: DaycareSessionStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  socialObservations?: string;
  incidents?: string;
  emotionalState?: string;
}
