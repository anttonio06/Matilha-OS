"use client";

/**
 * MATILHA OS — Database Layer
 * LocalStorage-backed CRUD — drop-in ready for REST/Supabase/Prisma swap.
 *
 * Performance architecture:
 * - In-memory write-through cache: reads are O(1) Map lookups after first hydration
 * - Key-scoped events: components only re-render when their specific collection changes
 * - Debounced event emission for bulk operations (e.g. CSV import)
 */

import type {
  Dog, Tutor, Appointment, Plan, Transaction,
  TeamMember, Product, HotelReservation, DaycareGroup, Alert,
} from "@/types";

// ─── Storage key constants ─────────────────────────────────────────────────────

export const KEYS = {
  dogs:         "matilha:dogs",
  tutors:       "matilha:tutors",
  appointments: "matilha:appointments",
  plans:        "matilha:plans",
  transactions: "matilha:transactions",
  team:         "matilha:team",
  products:     "matilha:products",
  hotel:        "matilha:hotel",
  groups:       "matilha:groups",
  alerts:       "matilha:alerts",
} as const;

export const DB_CHANGE_EVENT = "matilha:db:change";

// ─── In-memory write-through cache ───────────────────────────────────────────
// Eliminates repeated JSON.parse on every read.
// Cache is invalidated and rebuilt on every write.

const _cache = new Map<string, unknown[]>();

// Debounce timer for bulk emit (CSV import fires many writes at once)
const _emitTimers = new Map<string, ReturnType<typeof setTimeout>>();

function emit(key: string, immediate = false) {
  if (typeof window === "undefined") return;
  if (immediate) {
    window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT, { detail: { key } }));
    return;
  }
  // Debounce: coalesce rapid writes on same key into one event
  const existing = _emitTimers.get(key);
  if (existing) clearTimeout(existing);
  _emitTimers.set(key, setTimeout(() => {
    _emitTimers.delete(key);
    window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT, { detail: { key } }));
  }, 16)); // one animation frame
}

// ─── Generic CRUD ─────────────────────────────────────────────────────────────

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  if (_cache.has(key)) return _cache.get(key) as T[];
  try {
    const raw = localStorage.getItem(key);
    const data = raw ? (JSON.parse(raw) as T[]) : [];
    _cache.set(key, data);
    return data;
  } catch { return []; }
}

function write<T>(key: string, data: T[], immediate = false): void {
  if (typeof window === "undefined") return;
  _cache.set(key, data);                         // update cache first (synchronous)
  localStorage.setItem(key, JSON.stringify(data)); // persist
  emit(key, immediate);                          // notify subscribers (debounced by default)
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Cache invalidation helper (exported for SeedInit) ────────────────────────

export function invalidateCache(key?: string) {
  if (key) _cache.delete(key);
  else _cache.clear();
}

// ─── Dogs ─────────────────────────────────────────────────────────────────────

export const DogDB = {
  list:   ()              => read<Dog>(KEYS.dogs),
  get:    (id: string)    => read<Dog>(KEYS.dogs).find(d => d.id === id),
  create: (data: Omit<Dog, "id" | "createdAt">) => {
    const item: Dog = { ...data, id: genId("dog"), createdAt: new Date().toISOString() };
    write(KEYS.dogs, [...read<Dog>(KEYS.dogs), item], true);
    return item;
  },
  update: (id: string, patch: Partial<Dog>) => {
    write(KEYS.dogs, read<Dog>(KEYS.dogs).map(d => d.id === id ? { ...d, ...patch } : d), true);
  },
  delete: (id: string) => write(KEYS.dogs, read<Dog>(KEYS.dogs).filter(d => d.id !== id), true),
  count:  ()              => read<Dog>(KEYS.dogs).length,
};

// ─── Tutors ───────────────────────────────────────────────────────────────────

export const TutorDB = {
  list:   ()              => read<Tutor>(KEYS.tutors),
  get:    (id: string)    => read<Tutor>(KEYS.tutors).find(t => t.id === id),
  create: (data: Omit<Tutor, "id" | "createdAt">) => {
    const item: Tutor = { ...data, id: genId("tutor"), createdAt: new Date().toISOString() };
    write(KEYS.tutors, [...read<Tutor>(KEYS.tutors), item], true);
    return item;
  },
  update: (id: string, patch: Partial<Tutor>) => {
    write(KEYS.tutors, read<Tutor>(KEYS.tutors).map(t => t.id === id ? { ...t, ...patch } : t), true);
  },
  delete: (id: string) => write(KEYS.tutors, read<Tutor>(KEYS.tutors).filter(t => t.id !== id), true),
  count:  ()              => read<Tutor>(KEYS.tutors).length,
};

// ─── Appointments ─────────────────────────────────────────────────────────────

export const AppointmentDB = {
  list:   ()              => read<Appointment>(KEYS.appointments),
  get:    (id: string)    => read<Appointment>(KEYS.appointments).find(a => a.id === id),
  create: (data: Omit<Appointment, "id" | "createdAt">) => {
    const item: Appointment = { ...data, id: genId("apt"), createdAt: new Date().toISOString() };
    write(KEYS.appointments, [...read<Appointment>(KEYS.appointments), item], true);
    return item;
  },
  update: (id: string, patch: Partial<Appointment>) => {
    write(KEYS.appointments, read<Appointment>(KEYS.appointments).map(a => a.id === id ? { ...a, ...patch } : a), true);
  },
  delete: (id: string) => write(KEYS.appointments, read<Appointment>(KEYS.appointments).filter(a => a.id !== id), true),
  today:  () => {
    const today = new Date().toISOString().split("T")[0];
    return read<Appointment>(KEYS.appointments).filter(a => a.date === today);
  },
};

// ─── Plans ────────────────────────────────────────────────────────────────────

export const PlanDB = {
  list:   ()              => read<Plan>(KEYS.plans),
  get:    (id: string)    => read<Plan>(KEYS.plans).find(p => p.id === id),
  create: (data: Omit<Plan, "id">) => {
    const item: Plan = { ...data, id: genId("plan") };
    write(KEYS.plans, [...read<Plan>(KEYS.plans), item], true);
    return item;
  },
  update: (id: string, patch: Partial<Plan>) => {
    write(KEYS.plans, read<Plan>(KEYS.plans).map(p => p.id === id ? { ...p, ...patch } : p), true);
  },
  delete: (id: string) => write(KEYS.plans, read<Plan>(KEYS.plans).filter(p => p.id !== id), true),
  active: ()              => read<Plan>(KEYS.plans).filter(p => p.status === "ativo"),
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const TransactionDB = {
  list:     ()              => read<Transaction>(KEYS.transactions),
  get:      (id: string)    => read<Transaction>(KEYS.transactions).find(t => t.id === id),
  create:   (data: Omit<Transaction, "id" | "createdAt">) => {
    const item: Transaction = { ...data, id: genId("txn"), createdAt: new Date().toISOString() };
    write(KEYS.transactions, [...read<Transaction>(KEYS.transactions), item], true);
    return item;
  },
  update:   (id: string, patch: Partial<Transaction>) => {
    write(KEYS.transactions, read<Transaction>(KEYS.transactions).map(t => t.id === id ? { ...t, ...patch } : t), true);
  },
  delete:   (id: string) => write(KEYS.transactions, read<Transaction>(KEYS.transactions).filter(t => t.id !== id), true),
  revenue:  ()              => read<Transaction>(KEYS.transactions).filter(t => t.type === "receita"),
  expenses: ()              => read<Transaction>(KEYS.transactions).filter(t => t.type === "despesa"),
};

// ─── Team ─────────────────────────────────────────────────────────────────────

export const TeamDB = {
  list:   ()              => read<TeamMember>(KEYS.team),
  get:    (id: string)    => read<TeamMember>(KEYS.team).find(m => m.id === id),
  create: (data: Omit<TeamMember, "id" | "createdAt">) => {
    const item: TeamMember = { ...data, id: genId("team"), createdAt: new Date().toISOString() };
    write(KEYS.team, [...read<TeamMember>(KEYS.team), item], true);
    return item;
  },
  update: (id: string, patch: Partial<TeamMember>) => {
    write(KEYS.team, read<TeamMember>(KEYS.team).map(m => m.id === id ? { ...m, ...patch } : m), true);
  },
  delete: (id: string) => write(KEYS.team, read<TeamMember>(KEYS.team).filter(m => m.id !== id), true),
  active: ()              => read<TeamMember>(KEYS.team).filter(m => m.active),
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const ProductDB = {
  list:   ()              => read<Product>(KEYS.products),
  get:    (id: string)    => read<Product>(KEYS.products).find(p => p.id === id),
  create: (data: Omit<Product, "id">) => {
    const item: Product = { ...data, id: genId("prod") };
    write(KEYS.products, [...read<Product>(KEYS.products), item], true);
    return item;
  },
  update: (id: string, patch: Partial<Product>) => {
    write(KEYS.products, read<Product>(KEYS.products).map(p => p.id === id ? { ...p, ...patch } : p), true);
  },
  delete: (id: string) => write(KEYS.products, read<Product>(KEYS.products).filter(p => p.id !== id), true),
  active: ()              => read<Product>(KEYS.products).filter(p => p.active),
};

// ─── Hotel ────────────────────────────────────────────────────────────────────

export const HotelDB = {
  list:   ()              => read<HotelReservation>(KEYS.hotel),
  get:    (id: string)    => read<HotelReservation>(KEYS.hotel).find(r => r.id === id),
  create: (data: Omit<HotelReservation, "id">) => {
    const item: HotelReservation = { ...data, id: genId("hotel") };
    write(KEYS.hotel, [...read<HotelReservation>(KEYS.hotel), item], true);
    return item;
  },
  update: (id: string, patch: Partial<HotelReservation>) => {
    write(KEYS.hotel, read<HotelReservation>(KEYS.hotel).map(r => r.id === id ? { ...r, ...patch } : r), true);
  },
  delete: (id: string) => write(KEYS.hotel, read<HotelReservation>(KEYS.hotel).filter(r => r.id !== id), true),
  active: ()              => read<HotelReservation>(KEYS.hotel).filter(r => r.status === "hospedado"),
};

// ─── Groups ───────────────────────────────────────────────────────────────────

export const GroupDB = {
  list:   ()              => read<DaycareGroup>(KEYS.groups),
  create: (data: Omit<DaycareGroup, "id">) => {
    const item: DaycareGroup = { ...data, id: genId("grp") };
    write(KEYS.groups, [...read<DaycareGroup>(KEYS.groups), item]);
    return item;
  },
  update: (id: string, patch: Partial<DaycareGroup>) => {
    write(KEYS.groups, read<DaycareGroup>(KEYS.groups).map(g => g.id === id ? { ...g, ...patch } : g));
  },
  delete: (id: string) => write(KEYS.groups, read<DaycareGroup>(KEYS.groups).filter(g => g.id !== id)),
};

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const AlertDB = {
  list:    ()              => read<Alert>(KEYS.alerts),
  create:  (data: Omit<Alert, "id" | "createdAt">) => {
    const item: Alert = { ...data, id: genId("alert"), createdAt: new Date().toISOString() };
    write(KEYS.alerts, [...read<Alert>(KEYS.alerts), item]);
    return item;
  },
  dismiss: (id: string) => {
    write(KEYS.alerts, read<Alert>(KEYS.alerts).map(a => a.id === id ? { ...a, dismissed: true } : a));
  },
  active:  ()              => read<Alert>(KEYS.alerts).filter(a => !a.dismissed),
};

// ─── Bulk import ──────────────────────────────────────────────────────────────

export const BulkImport = {
  dogs: (items: Omit<Dog, "id" | "createdAt">[]) => {
    const existing = read<Dog>(KEYS.dogs);
    const newItems = items.map(d => ({ ...d, id: genId("dog"), createdAt: new Date().toISOString() } as Dog));
    write(KEYS.dogs, [...existing, ...newItems]);
    return newItems.length;
  },
  tutors: (items: Omit<Tutor, "id" | "createdAt">[]) => {
    const existing = read<Tutor>(KEYS.tutors);
    const newItems = items.map(t => ({ ...t, id: genId("tutor"), createdAt: new Date().toISOString() } as Tutor));
    write(KEYS.tutors, [...existing, ...newItems]);
    return newItems.length;
  },
  products: (items: Omit<Product, "id">[]) => {
    const existing = read<Product>(KEYS.products);
    const newItems = items.map(p => ({ ...p, id: genId("prod") } as Product));
    write(KEYS.products, [...existing, ...newItems]);
    return newItems.length;
  },
  transactions: (items: Omit<Transaction, "id" | "createdAt">[]) => {
    const existing = read<Transaction>(KEYS.transactions);
    const newItems = items.map(t => ({ ...t, id: genId("txn"), createdAt: new Date().toISOString() } as Transaction));
    write(KEYS.transactions, [...existing, ...newItems]);
    return newItems.length;
  },
  /** Full reset — clears ALL collections and cache */
  reset: () => {
    Object.values(KEYS).forEach(k => {
      localStorage.removeItem(k);
      _cache.delete(k);
    });
    Object.values(KEYS).forEach(k => emit(k, true));
  },
};

// ─── React hook — subscribe to DB changes (key-scoped) ────────────────────────
//
// Usage:
//   const dogs = useDB(() => DogDB.list(), KEYS.dogs);
//
// The watchKey param makes this component ONLY re-render when that specific
// collection changes — not on every DB write anywhere in the system.
// Omit watchKey to retain the old "re-render on any change" behavior.

import { useEffect, useRef, useState } from "react";

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
      // Key-scoped: skip if this event is for a different collection
      if (watchKey && detail?.key && detail.key !== watchKey) return;
      setData(fetcherRef.current());
    };
    window.addEventListener(DB_CHANGE_EVENT, handler);
    return () => window.removeEventListener(DB_CHANGE_EVENT, handler);
  }, [watchKey]);

  return data;
}
