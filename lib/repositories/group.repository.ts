"use client";

import { read, write, generateId } from "@/lib/db/storage";
import { STORAGE_KEYS } from "@/lib/db/keys";
import type { DaycareGroup } from "@/types/domain/daycare";

const KEY = STORAGE_KEYS.groups;

export const GroupRepository = {
  list: (): DaycareGroup[] =>
    read<DaycareGroup>(KEY),

  findById: (id: string): DaycareGroup | undefined =>
    read<DaycareGroup>(KEY).find(g => g.id === id),

  totalCapacity: (): number =>
    read<DaycareGroup>(KEY).reduce((sum, g) => sum + g.capacity, 0),

  create: (data: Omit<DaycareGroup, "id">): DaycareGroup => {
    const group: DaycareGroup = { ...data, id: generateId("grp") };
    write(KEY, [...read<DaycareGroup>(KEY), group]);
    return group;
  },

  update: (id: string, patch: Partial<DaycareGroup>): void => {
    write(KEY, read<DaycareGroup>(KEY).map(g => g.id === id ? { ...g, ...patch } : g));
  },

  delete: (id: string): void => {
    write(KEY, read<DaycareGroup>(KEY).filter(g => g.id !== id));
  },
};
