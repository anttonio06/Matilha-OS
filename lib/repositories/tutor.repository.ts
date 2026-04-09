"use client";

import { read, write, generateId } from "@/lib/db/storage";
import { STORAGE_KEYS } from "@/lib/db/keys";
import type { Tutor } from "@/types/domain/tutor";

const KEY = STORAGE_KEYS.tutors;

export const TutorRepository = {
  list: (): Tutor[] =>
    read<Tutor>(KEY),

  findById: (id: string): Tutor | undefined =>
    read<Tutor>(KEY).find(t => t.id === id),

  findByCpf: (cpf: string): Tutor | undefined =>
    read<Tutor>(KEY).find(t => t.cpf === cpf),

  create: (data: Omit<Tutor, "id" | "createdAt">): Tutor => {
    const tutor: Tutor = { ...data, id: generateId("tutor"), createdAt: new Date().toISOString() };
    write(KEY, [...read<Tutor>(KEY), tutor], true);
    return tutor;
  },

  update: (id: string, patch: Partial<Tutor>): void => {
    write(KEY, read<Tutor>(KEY).map(t => t.id === id ? { ...t, ...patch } : t), true);
  },

  delete: (id: string): void => {
    write(KEY, read<Tutor>(KEY).filter(t => t.id !== id), true);
  },

  count: (): number =>
    read<Tutor>(KEY).length,

  listActive: (): Tutor[] =>
    read<Tutor>(KEY).filter(t => t.status === "ativo"),

  listCreatedInMonth: (yearMonth: string): Tutor[] =>
    read<Tutor>(KEY).filter(t => t.createdAt?.startsWith(yearMonth)),
};
