"use client";

import { read, write, generateId } from "@/lib/db/storage";
import { STORAGE_KEYS } from "@/lib/db/keys";
import type { Appointment, AppointmentStatus } from "@/types/domain/appointment";

const KEY = STORAGE_KEYS.appointments;

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export const AppointmentRepository = {
  list: (): Appointment[] =>
    read<Appointment>(KEY),

  findById: (id: string): Appointment | undefined =>
    read<Appointment>(KEY).find(a => a.id === id),

  listToday: (): Appointment[] => {
    const today = todayIso();
    return read<Appointment>(KEY).filter(a => a.date === today);
  },

  listByDate: (date: string): Appointment[] =>
    read<Appointment>(KEY).filter(a => a.date === date),

  listByStatus: (status: AppointmentStatus): Appointment[] =>
    read<Appointment>(KEY).filter(a => a.status === status),

  listByDog: (dogId: string): Appointment[] =>
    read<Appointment>(KEY).filter(a => a.dogId === dogId),

  listByTutor: (tutorId: string): Appointment[] =>
    read<Appointment>(KEY).filter(a => a.tutorId === tutorId),

  create: (data: Omit<Appointment, "id" | "createdAt">): Appointment => {
    const appointment: Appointment = {
      ...data,
      id: generateId("apt"),
      createdAt: new Date().toISOString(),
    };
    write(KEY, [...read<Appointment>(KEY), appointment], true);
    return appointment;
  },

  update: (id: string, patch: Partial<Appointment>): void => {
    write(KEY, read<Appointment>(KEY).map(a => a.id === id ? { ...a, ...patch } : a), true);
  },

  delete: (id: string): void => {
    write(KEY, read<Appointment>(KEY).filter(a => a.id !== id), true);
  },
};
