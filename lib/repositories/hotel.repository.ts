"use client";

import { read, write, generateId } from "@/lib/db/storage";
import { STORAGE_KEYS } from "@/lib/db/keys";
import type { HotelReservation } from "@/types/domain/hotel";

const KEY = STORAGE_KEYS.hotel;

export const HotelRepository = {
  list: (): HotelReservation[] =>
    read<HotelReservation>(KEY),

  findById: (id: string): HotelReservation | undefined =>
    read<HotelReservation>(KEY).find(r => r.id === id),

  listActive: (): HotelReservation[] =>
    read<HotelReservation>(KEY).filter(r => r.status === "hospedado"),

  listByDog: (dogId: string): HotelReservation[] =>
    read<HotelReservation>(KEY).filter(r => r.dogId === dogId),

  listCheckoutsToday: (): HotelReservation[] => {
    const today = new Date().toISOString().split("T")[0];
    return read<HotelReservation>(KEY).filter(r => r.checkOut === today && r.status === "hospedado");
  },

  listCheckinsToday: (): HotelReservation[] => {
    const today = new Date().toISOString().split("T")[0];
    return read<HotelReservation>(KEY).filter(r => r.checkIn === today && r.status === "reservado");
  },

  create: (data: Omit<HotelReservation, "id">): HotelReservation => {
    const reservation: HotelReservation = { ...data, id: generateId("hotel") };
    write(KEY, [...read<HotelReservation>(KEY), reservation], true);
    return reservation;
  },

  update: (id: string, patch: Partial<HotelReservation>): void => {
    write(KEY, read<HotelReservation>(KEY).map(r => r.id === id ? { ...r, ...patch } : r), true);
  },

  delete: (id: string): void => {
    write(KEY, read<HotelReservation>(KEY).filter(r => r.id !== id), true);
  },
};
