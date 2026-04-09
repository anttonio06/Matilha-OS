"use client";

/**
 * Matilha OS — Database Façade
 *
 * Exposes named DB objects (DogDB, TutorDB, …) and the useDB React hook.
 * Internally delegates to lib/db/storage.ts for I/O and lib/db/keys.ts for
 * storage key constants — keeping all persistence concerns in one place.
 *
 * MIGRATION PATH
 *   Current:  import { DogDB } from "@/lib/db"
 *   Future:   import { DogRepository } from "@/lib/repositories"
 *
 * Both are valid. The repositories in lib/repositories/ are the canonical
 * source of truth; this file re-implements the same API for backward compat.
 */

import { read, write, generateId, invalidateCache } from "./db/storage";
import { STORAGE_KEYS } from "./db/keys";
import { useEffect, useRef, useState } from "react";

export { DB_CHANGE_EVENT } from "./db/storage";
export { STORAGE_KEYS as KEYS } from "./db/keys";
export { invalidateCache };

// ─── Re-import for BulkImport reset (needs DB_CHANGE_EVENT) ──────────────────
import { DB_CHANGE_EVENT } from "./db/storage";

// ─── Type imports ─────────────────────────────────────────────────────────────

import type { Dog }             from "@/types/domain/dog";
import type { Tutor }           from "@/types/domain/tutor";
import type { Appointment }     from "@/types/domain/appointment";
import type { Plan }            from "@/types/domain/plan";
import type { Transaction }     from "@/types/domain/transaction";
import type { HotelReservation } from "@/types/domain/hotel";
import type { Alert }           from "@/types/domain/alert";
import type { TeamMember }      from "@/types/domain/team";
import type { Product }         from "@/types/domain/product";
import type { DaycareGroup }    from "@/types/domain/daycare";

// ─── Dogs ─────────────────────────────────────────────────────────────────────

export const DogDB = {
  list:    ():                    Dog[]          => read<Dog>(STORAGE_KEYS.dogs),
  get:     (id: string):          Dog | undefined => read<Dog>(STORAGE_KEYS.dogs).find(d => d.id === id),
  create:  (data: Omit<Dog, "id" | "createdAt">): Dog => {
    const item: Dog = { ...data, id: generateId("dog"), createdAt: new Date().toISOString() };
    write(STORAGE_KEYS.dogs, [...read<Dog>(STORAGE_KEYS.dogs), item], true);
    return item;
  },
  update:  (id: string, patch: Partial<Dog>): void =>
    write(STORAGE_KEYS.dogs, read<Dog>(STORAGE_KEYS.dogs).map(d => d.id === id ? { ...d, ...patch } : d), true),
  delete:  (id: string): void =>
    write(STORAGE_KEYS.dogs, read<Dog>(STORAGE_KEYS.dogs).filter(d => d.id !== id), true),
  count:   (): number => read<Dog>(STORAGE_KEYS.dogs).length,
};

// ─── Tutors ───────────────────────────────────────────────────────────────────

export const TutorDB = {
  list:    ():                     Tutor[]          => read<Tutor>(STORAGE_KEYS.tutors),
  get:     (id: string):           Tutor | undefined => read<Tutor>(STORAGE_KEYS.tutors).find(t => t.id === id),
  create:  (data: Omit<Tutor, "id" | "createdAt">): Tutor => {
    const item: Tutor = { ...data, id: generateId("tutor"), createdAt: new Date().toISOString() };
    write(STORAGE_KEYS.tutors, [...read<Tutor>(STORAGE_KEYS.tutors), item], true);
    return item;
  },
  update:  (id: string, patch: Partial<Tutor>): void =>
    write(STORAGE_KEYS.tutors, read<Tutor>(STORAGE_KEYS.tutors).map(t => t.id === id ? { ...t, ...patch } : t), true),
  delete:  (id: string): void =>
    write(STORAGE_KEYS.tutors, read<Tutor>(STORAGE_KEYS.tutors).filter(t => t.id !== id), true),
  count:   (): number => read<Tutor>(STORAGE_KEYS.tutors).length,
};

// ─── Appointments ─────────────────────────────────────────────────────────────

export const AppointmentDB = {
  list:    ():                          Appointment[]          => read<Appointment>(STORAGE_KEYS.appointments),
  get:     (id: string):                Appointment | undefined => read<Appointment>(STORAGE_KEYS.appointments).find(a => a.id === id),
  today:   (): Appointment[] => {
    const today = new Date().toISOString().split("T")[0];
    return read<Appointment>(STORAGE_KEYS.appointments).filter(a => a.date === today);
  },
  create:  (data: Omit<Appointment, "id" | "createdAt">): Appointment => {
    const item: Appointment = { ...data, id: generateId("apt"), createdAt: new Date().toISOString() };
    write(STORAGE_KEYS.appointments, [...read<Appointment>(STORAGE_KEYS.appointments), item], true);
    return item;
  },
  update:  (id: string, patch: Partial<Appointment>): void =>
    write(STORAGE_KEYS.appointments, read<Appointment>(STORAGE_KEYS.appointments).map(a => a.id === id ? { ...a, ...patch } : a), true),
  delete:  (id: string): void =>
    write(STORAGE_KEYS.appointments, read<Appointment>(STORAGE_KEYS.appointments).filter(a => a.id !== id), true),
};

// ─── Plans ────────────────────────────────────────────────────────────────────

export const PlanDB = {
  list:    ():                     Plan[]          => read<Plan>(STORAGE_KEYS.plans),
  get:     (id: string):           Plan | undefined => read<Plan>(STORAGE_KEYS.plans).find(p => p.id === id),
  active:  ():                     Plan[]           => read<Plan>(STORAGE_KEYS.plans).filter(p => p.status === "ativo"),
  create:  (data: Omit<Plan, "id">): Plan => {
    const item: Plan = { ...data, id: generateId("plan") };
    write(STORAGE_KEYS.plans, [...read<Plan>(STORAGE_KEYS.plans), item], true);
    return item;
  },
  update:  (id: string, patch: Partial<Plan>): void =>
    write(STORAGE_KEYS.plans, read<Plan>(STORAGE_KEYS.plans).map(p => p.id === id ? { ...p, ...patch } : p), true),
  delete:  (id: string): void =>
    write(STORAGE_KEYS.plans, read<Plan>(STORAGE_KEYS.plans).filter(p => p.id !== id), true),
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const TransactionDB = {
  list:     ():                          Transaction[]          => read<Transaction>(STORAGE_KEYS.transactions),
  get:      (id: string):                Transaction | undefined => read<Transaction>(STORAGE_KEYS.transactions).find(t => t.id === id),
  revenue:  ():                          Transaction[]           => read<Transaction>(STORAGE_KEYS.transactions).filter(t => t.type === "receita"),
  expenses: ():                          Transaction[]           => read<Transaction>(STORAGE_KEYS.transactions).filter(t => t.type === "despesa"),
  create:   (data: Omit<Transaction, "id" | "createdAt">): Transaction => {
    const item: Transaction = { ...data, id: generateId("txn"), createdAt: new Date().toISOString() };
    write(STORAGE_KEYS.transactions, [...read<Transaction>(STORAGE_KEYS.transactions), item], true);
    return item;
  },
  update:   (id: string, patch: Partial<Transaction>): void =>
    write(STORAGE_KEYS.transactions, read<Transaction>(STORAGE_KEYS.transactions).map(t => t.id === id ? { ...t, ...patch } : t), true),
  delete:   (id: string): void =>
    write(STORAGE_KEYS.transactions, read<Transaction>(STORAGE_KEYS.transactions).filter(t => t.id !== id), true),
};

// ─── Hotel ────────────────────────────────────────────────────────────────────

export const HotelDB = {
  list:    ():                          HotelReservation[]          => read<HotelReservation>(STORAGE_KEYS.hotel),
  get:     (id: string):                HotelReservation | undefined => read<HotelReservation>(STORAGE_KEYS.hotel).find(r => r.id === id),
  active:  ():                          HotelReservation[]           => read<HotelReservation>(STORAGE_KEYS.hotel).filter(r => r.status === "hospedado"),
  create:  (data: Omit<HotelReservation, "id">): HotelReservation => {
    const item: HotelReservation = { ...data, id: generateId("hotel") };
    write(STORAGE_KEYS.hotel, [...read<HotelReservation>(STORAGE_KEYS.hotel), item], true);
    return item;
  },
  update:  (id: string, patch: Partial<HotelReservation>): void =>
    write(STORAGE_KEYS.hotel, read<HotelReservation>(STORAGE_KEYS.hotel).map(r => r.id === id ? { ...r, ...patch } : r), true),
  delete:  (id: string): void =>
    write(STORAGE_KEYS.hotel, read<HotelReservation>(STORAGE_KEYS.hotel).filter(r => r.id !== id), true),
};

// ─── Team ─────────────────────────────────────────────────────────────────────

export const TeamDB = {
  list:    ():                       TeamMember[]          => read<TeamMember>(STORAGE_KEYS.team),
  get:     (id: string):             TeamMember | undefined => read<TeamMember>(STORAGE_KEYS.team).find(m => m.id === id),
  active:  ():                       TeamMember[]           => read<TeamMember>(STORAGE_KEYS.team).filter(m => m.active),
  create:  (data: Omit<TeamMember, "id" | "createdAt">): TeamMember => {
    const item: TeamMember = { ...data, id: generateId("team"), createdAt: new Date().toISOString() };
    write(STORAGE_KEYS.team, [...read<TeamMember>(STORAGE_KEYS.team), item], true);
    return item;
  },
  update:  (id: string, patch: Partial<TeamMember>): void =>
    write(STORAGE_KEYS.team, read<TeamMember>(STORAGE_KEYS.team).map(m => m.id === id ? { ...m, ...patch } : m), true),
  delete:  (id: string): void =>
    write(STORAGE_KEYS.team, read<TeamMember>(STORAGE_KEYS.team).filter(m => m.id !== id), true),
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const ProductDB = {
  list:    ():                    Product[]          => read<Product>(STORAGE_KEYS.products),
  get:     (id: string):          Product | undefined => read<Product>(STORAGE_KEYS.products).find(p => p.id === id),
  active:  ():                    Product[]           => read<Product>(STORAGE_KEYS.products).filter(p => p.active),
  create:  (data: Omit<Product, "id">): Product => {
    const item: Product = { ...data, id: generateId("prod") };
    write(STORAGE_KEYS.products, [...read<Product>(STORAGE_KEYS.products), item], true);
    return item;
  },
  update:  (id: string, patch: Partial<Product>): void =>
    write(STORAGE_KEYS.products, read<Product>(STORAGE_KEYS.products).map(p => p.id === id ? { ...p, ...patch } : p), true),
  delete:  (id: string): void =>
    write(STORAGE_KEYS.products, read<Product>(STORAGE_KEYS.products).filter(p => p.id !== id), true),
};

// ─── Groups ───────────────────────────────────────────────────────────────────

export const GroupDB = {
  list:    ():                        DaycareGroup[]           => read<DaycareGroup>(STORAGE_KEYS.groups),
  create:  (data: Omit<DaycareGroup, "id">): DaycareGroup => {
    const item: DaycareGroup = { ...data, id: generateId("grp") };
    write(STORAGE_KEYS.groups, [...read<DaycareGroup>(STORAGE_KEYS.groups), item]);
    return item;
  },
  update:  (id: string, patch: Partial<DaycareGroup>): void =>
    write(STORAGE_KEYS.groups, read<DaycareGroup>(STORAGE_KEYS.groups).map(g => g.id === id ? { ...g, ...patch } : g)),
  delete:  (id: string): void =>
    write(STORAGE_KEYS.groups, read<DaycareGroup>(STORAGE_KEYS.groups).filter(g => g.id !== id)),
};

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const AlertDB = {
  list:    ():                     Alert[]          => read<Alert>(STORAGE_KEYS.alerts),
  active:  ():                     Alert[]           => read<Alert>(STORAGE_KEYS.alerts).filter(a => !a.dismissed),
  create:  (data: Omit<Alert, "id" | "createdAt">): Alert => {
    const item: Alert = { ...data, id: generateId("alert"), createdAt: new Date().toISOString() };
    write(STORAGE_KEYS.alerts, [...read<Alert>(STORAGE_KEYS.alerts), item]);
    return item;
  },
  dismiss: (id: string): void =>
    write(STORAGE_KEYS.alerts, read<Alert>(STORAGE_KEYS.alerts).map(a => a.id === id ? { ...a, dismissed: true } : a)),
};

// ─── Bulk import ──────────────────────────────────────────────────────────────

export const BulkImport = {
  dogs: (items: Omit<Dog, "id" | "createdAt">[]): number => {
    const newItems = items.map(d => ({ ...d, id: generateId("dog"), createdAt: new Date().toISOString() } as Dog));
    write(STORAGE_KEYS.dogs, [...read<Dog>(STORAGE_KEYS.dogs), ...newItems]);
    return newItems.length;
  },
  tutors: (items: Omit<Tutor, "id" | "createdAt">[]): number => {
    const newItems = items.map(t => ({ ...t, id: generateId("tutor"), createdAt: new Date().toISOString() } as Tutor));
    write(STORAGE_KEYS.tutors, [...read<Tutor>(STORAGE_KEYS.tutors), ...newItems]);
    return newItems.length;
  },
  products: (items: Omit<Product, "id">[]): number => {
    const newItems = items.map(p => ({ ...p, id: generateId("prod") } as Product));
    write(STORAGE_KEYS.products, [...read<Product>(STORAGE_KEYS.products), ...newItems]);
    return newItems.length;
  },
  transactions: (items: Omit<Transaction, "id" | "createdAt">[]): number => {
    const newItems = items.map(t => ({ ...t, id: generateId("txn"), createdAt: new Date().toISOString() } as Transaction));
    write(STORAGE_KEYS.transactions, [...read<Transaction>(STORAGE_KEYS.transactions), ...newItems]);
    return newItems.length;
  },
  reset: (): void => {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    invalidateCache();
    Object.values(STORAGE_KEYS).forEach(k =>
      window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT, { detail: { key: k } }))
    );
  },
};

// ─── React hook ───────────────────────────────────────────────────────────────
//
// Usage:
//   const dogs = useDB(() => DogDB.list(), KEYS.dogs);
//
// Key-scoped: this component re-renders ONLY when KEYS.dogs changes —
// not on any other collection write.

export function useDB<T>(fetcher: () => T, watchKey?: string): T {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState<T>(() => {
    try { return fetcher(); }
    catch { return undefined as unknown as T; }
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (watchKey && detail?.key && detail.key !== watchKey) return;
      setData(fetcherRef.current());
    };
    window.addEventListener(DB_CHANGE_EVENT, handler);
    return () => window.removeEventListener(DB_CHANGE_EVENT, handler);
  }, [watchKey]);

  return data;
}
