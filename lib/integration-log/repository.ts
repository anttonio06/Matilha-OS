/**
 * Integration audit log — append-only file store.
 *
 * Every significant event (sync attempt, webhook received, error, retry)
 * is recorded here for debugging and compliance.
 *
 * File: <DATA_DIR>/integration-log.jsonl  (newline-delimited JSON)
 *
 * JSONL (one JSON object per line) is chosen over a single JSON array because:
 *   - Appending a line is O(1) — no need to read + re-parse the entire file
 *   - Each line is independently parseable — partial writes don't corrupt all logs
 *   - Easy to pipe into jq, grep, or any log aggregator
 */

import fs from "fs";
import path from "path";

// -------------------------------------------------------------------------- //
// Types
// -------------------------------------------------------------------------- //

export interface IntegrationLogEntry {
  /** ISO 8601 */
  timestamp: string;
  partner_id: string;
  request_id: string;
  provider: string;
  /** Dot-separated event name, e.g. "customer.synced", "webhook.received" */
  event: string;
  status: "success" | "error" | "info";
  payload?: Record<string, unknown>;
}

// -------------------------------------------------------------------------- //
// Storage helpers
// -------------------------------------------------------------------------- //

function dataDir(): string {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  return path.join(process.cwd(), "data");
}

function logFile(): string {
  return path.join(dataDir(), "integration-log.jsonl");
}

function ensureDir(): void {
  const dir = dataDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// -------------------------------------------------------------------------- //
// Repository
// -------------------------------------------------------------------------- //

export const IntegrationLogRepository = {
  /**
   * Append a single log entry. Never throws — logging must not crash the caller.
   */
  append(entry: Omit<IntegrationLogEntry, "timestamp">): void {
    try {
      ensureDir();
      const line = JSON.stringify({
        timestamp: new Date().toISOString(),
        ...entry,
      });
      fs.appendFileSync(logFile(), line + "\n", "utf-8");
    } catch {
      // Swallow silently — log write failures must not propagate
    }
  },

  /**
   * Read recent entries (tail of file), most recent first.
   * @param limit Max number of entries to return (default 100)
   * @param partnerId Filter by partner ID (optional)
   */
  recent(limit = 100, partnerId?: string): IntegrationLogEntry[] {
    try {
      ensureDir();
      const file = logFile();
      if (!fs.existsSync(file)) return [];

      const raw = fs.readFileSync(file, "utf-8");
      const lines = raw.split("\n").filter(Boolean);

      // Parse in reverse (newest first), apply optional filter
      const results: IntegrationLogEntry[] = [];
      for (let i = lines.length - 1; i >= 0 && results.length < limit; i--) {
        try {
          const entry = JSON.parse(lines[i]) as IntegrationLogEntry;
          if (!partnerId || entry.partner_id === partnerId) {
            results.push(entry);
          }
        } catch {
          // Skip malformed lines
        }
      }

      return results;
    } catch {
      return [];
    }
  },
};
