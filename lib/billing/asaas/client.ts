/**
 * Low-level HTTP client for the Asaas API v3.
 *
 * Features:
 *   - Configurable timeout via AbortController
 *   - Exponential back-off retry for retryable errors (network, 5xx, timeout)
 *   - Structured error mapping (all throws are AsaasError subtypes)
 *   - Correlation-ID forwarded to every request
 *   - Sandbox / production URL resolved from env config
 */

import { getBillingConfig } from "@/lib/billing/config";
import {
  AsaasApiError,
  AsaasNetworkError,
  AsaasServerError,
  AsaasTimeoutError,
  AsaasValidationError,
  isRetryable,
} from "@/lib/billing/asaas/errors";
import { logger, newRequestId } from "@/lib/logger";

// -------------------------------------------------------------------------- //
// Configuration
// -------------------------------------------------------------------------- //

const DEFAULT_TIMEOUT_MS = 15_000;   // 15 s
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;         // 500 ms, 1 s, 2 s

// -------------------------------------------------------------------------- //
// Internal helpers
// -------------------------------------------------------------------------- //

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function backoffMs(attempt: number): number {
  // Exponential back-off with ±20% jitter to avoid thundering-herd
  const base = BASE_BACKOFF_MS * Math.pow(2, attempt);
  const jitter = base * (0.8 + Math.random() * 0.4);
  return Math.round(jitter);
}

async function parseErrorBody(response: Response): Promise<{ errors?: Array<{ code: string; description: string }> }> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

// -------------------------------------------------------------------------- //
// Core request function
// -------------------------------------------------------------------------- //

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  /** Forwarded as access_token in the URL (Asaas v3 auth method) */
  idempotencyKey?: string;
  requestId?: string;
  timeoutMs?: number;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const config = getBillingConfig();
  const {
    method = "GET",
    body,
    idempotencyKey,
    requestId = newRequestId(),
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = opts;

  const url = `${config.asaas.baseUrl}${path}`;
  const log = logger.child({ request_id: requestId });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "access_token": config.asaas.apiKey,
    "User-Agent": config.asaas.userAgent,
    "X-Request-Id": requestId,
  };

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const wait = backoffMs(attempt - 1);
      log.warn("asaas.client.retry", { attempt, wait_ms: wait, path });
      await sleep(wait);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      log.debug("asaas.client.request", { method, path, attempt });

      const response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // -------------------------------------------------------------------- //
      // Map HTTP status to typed errors
      // -------------------------------------------------------------------- //

      if (!response.ok) {
        const errorBody = await parseErrorBody(response);

        if (response.status === 400 && errorBody.errors?.length) {
          // Validation error — never retry
          throw new AsaasValidationError(errorBody.errors);
        }

        if (response.status >= 400 && response.status < 500) {
          // Other client errors (401, 403, 404, 409) — never retry
          throw new AsaasApiError(
            response.status,
            `Asaas API returned ${response.status} for ${method} ${path}`,
            { apiErrors: errorBody.errors }
          );
        }

        // 5xx — server error, may retry
        throw new AsaasServerError(
          response.status,
          `Asaas server error ${response.status} for ${method} ${path}`
        );
      }

      // 204 No Content
      if (response.status === 204) return undefined as unknown as T;

      const data = await response.json() as T;
      log.debug("asaas.client.response", { method, path, status: response.status });
      return data;

    } catch (err) {
      clearTimeout(timer);

      // AbortController fired
      if (err instanceof Error && err.name === "AbortError") {
        lastError = new AsaasTimeoutError(timeoutMs);
        log.warn("asaas.client.timeout", { method, path, timeout_ms: timeoutMs });
        // Timeout is retryable — continue loop
        continue;
      }

      // Already typed — check retry eligibility
      if (isRetryable(err) && attempt < MAX_RETRIES - 1) {
        lastError = err;
        continue;
      }

      // Non-retryable typed error — re-throw immediately
      if (err instanceof Error && (
        err.constructor.name === "AsaasApiError" ||
        err.constructor.name === "AsaasValidationError"
      )) {
        log.error("asaas.client.error", { method, path, error: err.message });
        throw err;
      }

      // Unknown error (fetch itself threw, e.g. network unreachable)
      const networkErr = new AsaasNetworkError(
        `Network error calling Asaas: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err : undefined
      );
      lastError = networkErr;

      if (attempt < MAX_RETRIES - 1) continue;
    }
  }

  // All retries exhausted
  log.error("asaas.client.exhausted", { method, path, retries: MAX_RETRIES });
  throw lastError;
}

// -------------------------------------------------------------------------- //
// Public API
// -------------------------------------------------------------------------- //

export const asaasClient = {
  get<T>(path: string, opts?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return request<T>(path, { ...opts, method: "GET" });
  },

  post<T>(path: string, body: unknown, opts?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return request<T>(path, { ...opts, method: "POST", body });
  },

  put<T>(path: string, body: unknown, opts?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return request<T>(path, { ...opts, method: "PUT", body });
  },

  delete<T>(path: string, opts?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return request<T>(path, { ...opts, method: "DELETE" });
  },
};
