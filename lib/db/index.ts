/**
 * Database layer — public surface.
 * Re-exports storage primitives and constants used across repositories.
 */
export { read, write, generateId, invalidateCache, DB_CHANGE_EVENT } from "./storage";
export { STORAGE_KEYS } from "./keys";
export type { StorageKey } from "./keys";
