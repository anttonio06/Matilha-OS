/**
 * Partner repository — file-based JSON store.
 *
 * Architecture decision: JSON files over a database for now.
 * Reasons:
 *   - No additional infrastructure (no Postgres/MySQL server to manage)
 *   - Zero-dependency — uses Node's built-in `fs` module
 *   - Atomic writes via tmp-file + rename pattern (prevents corruption)
 *   - Swappable: the service layer only calls `PartnerRepository` methods,
 *     so replacing this with Prisma/Drizzle later is a single-file change.
 *
 * Limitation: single-process only. For horizontal scaling, replace with
 * a real DB or a distributed store. Current use case (single server) is fine.
 *
 * Data directory: process.env.DATA_DIR ?? "<project-root>/data"
 * Partners file:  <DATA_DIR>/partners.json
 */

import fs from "fs";
import path from "path";
import type { Partner } from "@/lib/partners/types";

// -------------------------------------------------------------------------- //
// Storage helpers
// -------------------------------------------------------------------------- //

function dataDir(): string {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  // __dirname is not available in ESM/Next.js — use process.cwd() instead
  return path.join(process.cwd(), "data");
}

function partnersFile(): string {
  return path.join(dataDir(), "partners.json");
}

/** Ensure the data directory exists before any read/write. */
function ensureDir(): void {
  const dir = dataDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Read all partners from disk. Returns [] if file doesn't exist yet. */
function readAll(): Partner[] {
  ensureDir();
  const file = partnersFile();
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw) as Partner[];
  } catch {
    return [];
  }
}

/**
 * Atomic write: write to a temp file then rename.
 * Rename is atomic on POSIX and "as atomic as possible" on Windows.
 */
function writeAll(partners: Partner[]): void {
  ensureDir();
  const file = partnersFile();
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(partners, null, 2), "utf-8");
  fs.renameSync(tmp, file);
}

// -------------------------------------------------------------------------- //
// Repository
// -------------------------------------------------------------------------- //

export const PartnerRepository = {
  /** Return all partners. */
  list(): Partner[] {
    return readAll();
  },

  /** Find a partner by internal ID. Returns undefined if not found. */
  findById(id: string): Partner | undefined {
    return readAll().find(p => p.id === id);
  },

  /** Find a partner by CPF/CNPJ (digits only). Returns undefined if not found. */
  findByCpfCnpj(cpfCnpj: string): Partner | undefined {
    const digits = cpfCnpj.replace(/\D/g, "");
    return readAll().find(p => p.cpfCnpj === digits);
  },

  /** Persist a new partner. Throws if a partner with the same CPF/CNPJ exists. */
  create(partner: Partner): Partner {
    const all = readAll();
    const duplicate = all.find(p => p.cpfCnpj === partner.cpfCnpj);
    if (duplicate) {
      throw new Error(
        `Partner with CPF/CNPJ ${partner.cpfCnpj} already exists (id: ${duplicate.id})`
      );
    }
    all.push(partner);
    writeAll(all);
    return partner;
  },

  /**
   * Update specific fields of an existing partner.
   * Returns the updated partner, or undefined if not found.
   */
  update(id: string, patch: Partial<Partner>): Partner | undefined {
    const all = readAll();
    const idx = all.findIndex(p => p.id === id);
    if (idx === -1) return undefined;

    const updated: Partner = {
      ...all[idx],
      ...patch,
      id,                                    // id is immutable
      cpfCnpj: all[idx].cpfCnpj,            // cpfCnpj is immutable after creation
      created_at: all[idx].created_at,       // created_at is immutable
      updated_at: new Date().toISOString(),
    };

    all[idx] = updated;
    writeAll(all);
    return updated;
  },

  /** Delete a partner by ID. Returns true if deleted, false if not found. */
  delete(id: string): boolean {
    const all = readAll();
    const next = all.filter(p => p.id !== id);
    if (next.length === all.length) return false;
    writeAll(next);
    return true;
  },

  /** Return all partners whose billing sync is overdue for retry. */
  findReadyForRetry(): Partner[] {
    const now = new Date().toISOString();
    return readAll().filter(p =>
      p.billing_sync_status === "FAILED" &&
      p.billing_retry_count < 5 &&
      (!p.billing_retry_after || p.billing_retry_after <= now)
    );
  },
};
