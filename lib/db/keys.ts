/**
 * Storage key constants for LocalStorage collections.
 * Centralised here so renaming a key is a single-file change.
 */
export const STORAGE_KEYS = {
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

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
