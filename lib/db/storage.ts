"use client";

/**
 * Generic LocalStorage primitives with:
 *   - In-memory write-through cache (reads are O(1) after first hydration)
 *   - Debounced change events (coalesces burst writes into one re-render cycle)
 *   - Key-scoped event emission (components subscribe only to their collection)
 *
 * Swap strategy: replace `readFromStorage` / `writeToStorage` to migrate to
 * any REST backend or Supabase — repositories above do not change.
 */

export const DB_CHANGE_EVENT = "matilha:db:change";

// ─── In-memory write-through cache ───────────────────────────────────────────

const _cache = new Map<string, unknown[]>();
const _debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

// ─── Internal I/O ─────────────────────────────────────────────────────────────

function readFromStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  if (_cache.has(key)) return _cache.get(key) as T[];
  try {
    const raw = localStorage.getItem(key);
    const data = raw ? (JSON.parse(raw) as T[]) : [];
    _cache.set(key, data);
    return data;
  } catch {
    return [];
  }
}

function writeToStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  _cache.set(key, data);
  localStorage.setItem(key, JSON.stringify(data));
}

function emitChange(key: string, immediate = false): void {
  if (typeof window === "undefined") return;
  if (immediate) {
    window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT, { detail: { key } }));
    return;
  }
  const existing = _debounceTimers.get(key);
  if (existing) clearTimeout(existing);
  _debounceTimers.set(key, setTimeout(() => {
    _debounceTimers.delete(key);
    window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT, { detail: { key } }));
  }, 16));
}

// ─── Public primitives ────────────────────────────────────────────────────────

export function read<T>(key: string): T[] {
  return readFromStorage<T>(key);
}

export function write<T>(key: string, data: T[], immediate = false): void {
  writeToStorage(key, data);
  emitChange(key, immediate);
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function invalidateCache(key?: string): void {
  if (key) _cache.delete(key);
  else _cache.clear();
}
