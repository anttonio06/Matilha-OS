/**
 * Structured logger with correlation IDs.
 *
 * Every log entry includes:
 *   - timestamp (ISO 8601)
 *   - level
 *   - message
 *   - tenant_id  (when available via LogContext)
 *   - request_id (when available via LogContext)
 *   - any additional fields passed in `meta`
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *
 *   const log = logger.child({ tenant_id: "abc", request_id: "xyz" });
 *   log.info("partner.create", { cpf_cnpj: "..." });
 *   log.error("billing.sync.failed", { error: err.message });
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  tenant_id?: string;
  request_id?: string;
  [key: string]: unknown;
}

export interface LogEntry extends LogContext {
  timestamp: string;
  level: LogLevel;
  event: string;
  [key: string]: unknown;
}

function log(level: LogLevel, context: LogContext, event: string, meta: Record<string, unknown> = {}): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
    ...meta,
  };

  // In production replace with your log aggregator (Datadog, Grafana Loki, etc.)
  // For now we emit to stdout as JSON (parseable by log collectors).
  if (level === "error" || level === "warn") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  /** Create a child logger that merges additional context into every entry. */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  debug(event: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "production") {
      log("debug", this.context, event, meta);
    }
  }

  info(event: string, meta?: Record<string, unknown>): void {
    log("info", this.context, event, meta);
  }

  warn(event: string, meta?: Record<string, unknown>): void {
    log("warn", this.context, event, meta);
  }

  error(event: string, meta?: Record<string, unknown>): void {
    log("error", this.context, event, meta);
  }
}

/** Root logger — no context. Use .child() to add tenant_id / request_id. */
export const logger = new Logger();

/** Generate a short correlation ID for a request. */
export function newRequestId(): string {
  // crypto.randomUUID available in Node 18+ and all modern browsers
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
