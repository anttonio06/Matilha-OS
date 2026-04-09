"use client";

import { read, write, generateId } from "@/lib/db/storage";
import { STORAGE_KEYS } from "@/lib/db/keys";
import type { Plan } from "@/types/domain/plan";

const KEY = STORAGE_KEYS.plans;

export const PlanRepository = {
  list: (): Plan[] =>
    read<Plan>(KEY),

  findById: (id: string): Plan | undefined =>
    read<Plan>(KEY).find(p => p.id === id),

  listActive: (): Plan[] =>
    read<Plan>(KEY).filter(p => p.status === "ativo"),

  listByTutor: (tutorId: string): Plan[] =>
    read<Plan>(KEY).filter(p => p.tutorId === tutorId),

  listByDog: (dogId: string): Plan[] =>
    read<Plan>(KEY).filter(p => p.dogId === dogId),

  listExpiringByUses: (threshold = 2): Plan[] =>
    read<Plan>(KEY).filter(p =>
      p.status === "ativo" &&
      p.totalUses != null &&
      (p.totalUses - (p.usedUses ?? 0)) <= threshold
    ),

  create: (data: Omit<Plan, "id">): Plan => {
    const plan: Plan = { ...data, id: generateId("plan") };
    write(KEY, [...read<Plan>(KEY), plan], true);
    return plan;
  },

  update: (id: string, patch: Partial<Plan>): void => {
    write(KEY, read<Plan>(KEY).map(p => p.id === id ? { ...p, ...patch } : p), true);
  },

  delete: (id: string): void => {
    write(KEY, read<Plan>(KEY).filter(p => p.id !== id), true);
  },
};
