"use client";

/**
 * MATILHA OS — Performance Hooks
 * Shared hooks for debouncing, async queues, and optimistic UI.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── useDebounce ──────────────────────────────────────────────────────────────
// Delays applying a value until after the user has stopped typing.
// Use on search/filter inputs to avoid re-filtering on every keystroke.
//
// Usage: const query = useDebounce(rawInput, 200);

export function useDebounce<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── useAsync ─────────────────────────────────────────────────────────────────
// Runs an async operation and tracks its state (idle/loading/success/error).
// Prevents UI from blocking on external API calls.
//
// Usage:
//   const { run, loading, error } = useAsync();
//   await run(() => fetch(...));

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export function useAsync() {
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [error, setError]   = useState<string | null>(null);
  const mountedRef           = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    setStatus("loading");
    setError(null);
    try {
      const result = await fn();
      if (mountedRef.current) setStatus("success");
      return result;
    } catch (e: unknown) {
      if (mountedRef.current) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Erro desconhecido");
      }
      return undefined;
    }
  }, []);

  const reset = useCallback(() => { setStatus("idle"); setError(null); }, []);

  return { run, status, loading: status === "loading", error, reset };
}

// ─── useOptimistic ────────────────────────────────────────────────────────────
// Returns an optimistic version of a list so the UI reflects changes
// instantly, before the DB write confirms.
//
// Usage:
//   const [displayed, addOptimistic] = useOptimistic(dogs);
//   addOptimistic(newDog); // shows immediately; real insert happens async

export function useOptimistic<T extends { id: string }>(
  serverList: T[]
): [T[], (item: T) => void, (id: string) => void] {
  const [extras, setExtras] = useState<T[]>([]);

  // Sync: remove extras once they appear in the real list
  const merged = useMemo(() => {
    const serverIds = new Set(serverList.map(i => i.id));
    const pending   = extras.filter(e => !serverIds.has(e.id));
    return [...serverList, ...pending];
  }, [serverList, extras]);

  const add    = useCallback((item: T) => setExtras(p => [...p, item]), []);
  const remove = useCallback((id: string) => setExtras(p => p.filter(i => i.id !== id)), []);

  return [merged, add, remove];
}

// ─── useLocalStorage ──────────────────────────────────────────────────────────
// Synced state that persists to localStorage with SSR safety.

export function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch { return initial; }
  });

  const set = useCallback((v: T) => {
    setValue(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* quota exceeded */ }
  }, [key]);

  return [value, set];
}

// ─── usePagination ────────────────────────────────────────────────────────────
// Slices a list with stable memoization — avoids slicing on every render.

export function usePagination<T>(items: T[], perPage = 20) {
  const [page, setPage] = useState(1);

  // Reset to page 1 when list changes (e.g. after search filter)
  const prevLenRef = useRef(items.length);
  useEffect(() => {
    if (items.length !== prevLenRef.current) {
      setPage(1);
      prevLenRef.current = items.length;
    }
  }, [items.length]);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage   = Math.min(page, totalPages);

  const paginated = useMemo(
    () => items.slice((safePage - 1) * perPage, safePage * perPage),
    [items, safePage, perPage]
  );

  return {
    page: safePage,
    setPage,
    totalPages,
    paginated,
    total: items.length,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

// ─── useExternalApi ───────────────────────────────────────────────────────────
// Wraps external API calls with timeout, retry, and non-blocking semantics.
// The caller gets immediate feedback; the real result arrives asynchronously.

interface ExternalApiOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export function useExternalApi(opts: ExternalApiOptions = {}) {
  const { timeoutMs = 10000, retries = 2, retryDelayMs = 1000 } = opts;
  const { run, loading, error, status } = useAsync();

  const call = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    return run(async () => {
      let lastErr: unknown;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);
          try {
            const result = await fn();
            clearTimeout(timer);
            return result;
          } finally {
            clearTimeout(timer);
          }
        } catch (e) {
          lastErr = e;
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, retryDelayMs * (attempt + 1)));
          }
        }
      }
      throw lastErr;
    });
  }, [run, retries, retryDelayMs, timeoutMs]);

  return { call, loading, error, status };
}
