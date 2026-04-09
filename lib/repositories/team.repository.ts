"use client";

import { read, write, generateId } from "@/lib/db/storage";
import { STORAGE_KEYS } from "@/lib/db/keys";
import type { TeamMember } from "@/types/domain/team";

const KEY = STORAGE_KEYS.team;

export const TeamRepository = {
  list: (): TeamMember[] =>
    read<TeamMember>(KEY),

  findById: (id: string): TeamMember | undefined =>
    read<TeamMember>(KEY).find(m => m.id === id),

  listActive: (): TeamMember[] =>
    read<TeamMember>(KEY).filter(m => m.active),

  create: (data: Omit<TeamMember, "id" | "createdAt">): TeamMember => {
    const member: TeamMember = { ...data, id: generateId("team"), createdAt: new Date().toISOString() };
    write(KEY, [...read<TeamMember>(KEY), member], true);
    return member;
  },

  update: (id: string, patch: Partial<TeamMember>): void => {
    write(KEY, read<TeamMember>(KEY).map(m => m.id === id ? { ...m, ...patch } : m), true);
  },

  delete: (id: string): void => {
    write(KEY, read<TeamMember>(KEY).filter(m => m.id !== id), true);
  },
};
