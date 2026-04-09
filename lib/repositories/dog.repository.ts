"use client";

import { read, write, generateId } from "@/lib/db/storage";
import { STORAGE_KEYS } from "@/lib/db/keys";
import type { Dog } from "@/types/domain/dog";

const KEY = STORAGE_KEYS.dogs;

export const DogRepository = {
  list:   (): Dog[] =>
    read<Dog>(KEY),

  findById: (id: string): Dog | undefined =>
    read<Dog>(KEY).find(d => d.id === id),

  create: (data: Omit<Dog, "id" | "createdAt">): Dog => {
    const dog: Dog = { ...data, id: generateId("dog"), createdAt: new Date().toISOString() };
    write(KEY, [...read<Dog>(KEY), dog], true);
    return dog;
  },

  update: (id: string, patch: Partial<Dog>): void => {
    write(KEY, read<Dog>(KEY).map(d => d.id === id ? { ...d, ...patch } : d), true);
  },

  delete: (id: string): void => {
    write(KEY, read<Dog>(KEY).filter(d => d.id !== id), true);
  },

  count: (): number =>
    read<Dog>(KEY).length,
};
