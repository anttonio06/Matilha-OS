/**
 * Typed error classes for the Asaas integration.
 *
 * Using distinct error types allows callers to branch precisely:
 *   catch (err) {
 *     if (err instanceof AsaasValidationError) { // 400 — don't retry
 *     if (err instanceof AsaasNetworkError)       // retry is safe
 *     if (err instanceof AsaasTimeoutError)       // retry with backoff
 *   }
 */

/** Base class — all Asaas errors extend this. */
export class AsaasError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AsaasError";
    // Maintains proper prototype chain in transpiled ES5
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * HTTP 4xx from the Asaas API.
 * These are permanent failures (bad request, not found, etc.) — do NOT retry.
 */
export class AsaasApiError extends AsaasError {
  readonly statusCode: number;
  /** Asaas error code string, e.g. "invalid_action", "customer_not_found" */
  readonly code?: string;
  /** Array of error objects returned by the Asaas API */
  readonly apiErrors?: Array<{ code: string; description: string }>;

  constructor(
    statusCode: number,
    message: string,
    opts?: { code?: string; apiErrors?: Array<{ code: string; description: string }> }
  ) {
    super(message);
    this.name = "AsaasApiError";
    this.statusCode = statusCode;
    this.code = opts?.code;
    this.apiErrors = opts?.apiErrors;
  }
}

/**
 * HTTP 400 — validation error returned by the Asaas API.
 * Sub-class of AsaasApiError for easier instanceof checks.
 */
export class AsaasValidationError extends AsaasApiError {
  constructor(apiErrors: Array<{ code: string; description: string }>) {
    const descriptions = apiErrors.map(e => e.description).join("; ");
    super(400, `Asaas validation failed: ${descriptions}`, { apiErrors });
    this.name = "AsaasValidationError";
  }
}

/**
 * HTTP 5xx from the Asaas API, or an upstream server error.
 * May be transient — safe to retry with backoff.
 */
export class AsaasServerError extends AsaasApiError {
  constructor(statusCode: number, message: string) {
    super(statusCode, message);
    this.name = "AsaasServerError";
  }
}

/**
 * Network-level failure (DNS resolution, TCP connection refused, etc.).
 * Always safe to retry.
 */
export class AsaasNetworkError extends AsaasError {
  readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "AsaasNetworkError";
    this.cause = cause;
  }
}

/**
 * The Asaas API did not respond within the configured timeout.
 * Safe to retry — the request may or may not have reached Asaas.
 * Use idempotency keys on POST requests to avoid duplicates on retry.
 */
export class AsaasTimeoutError extends AsaasError {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Asaas API request timed out after ${timeoutMs}ms`);
    this.name = "AsaasTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

/** True when the error is worth retrying (network / server / timeout). */
export function isRetryable(err: unknown): boolean {
  return (
    err instanceof AsaasNetworkError ||
    err instanceof AsaasTimeoutError ||
    (err instanceof AsaasServerError && err.statusCode >= 500)
  );
}
