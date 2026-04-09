/**
 * Environment variable validation for billing configuration.
 *
 * Call `getBillingConfig()` in Route Handlers (server-side only).
 * It throws a descriptive error at startup if required vars are missing,
 * preventing silent mis-configurations from reaching production.
 *
 * This module is server-only — never imported in "use client" components.
 */

export interface BillingConfig {
  asaas: {
    apiKey: string;
    baseUrl: string;
    webhookToken: string;
    userAgent: string;
  };
}

let _cached: BillingConfig | null = null;

/**
 * Validate and return the billing configuration.
 * Throws if any required env var is absent or obviously wrong.
 * Result is memoised — validation runs once per process.
 */
export function getBillingConfig(): BillingConfig {
  if (_cached) return _cached;

  const errors: string[] = [];

  const apiKey = process.env.ASAAS_API_KEY ?? "";
  const baseUrl = process.env.ASAAS_BASE_URL ?? "https://sandbox.asaas.com/api/v3";
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN ?? "";
  const userAgent = process.env.ASAAS_USER_AGENT ?? "matilha-os/1.0";

  if (!apiKey) {
    errors.push("ASAAS_API_KEY is required. Get it from Asaas → Configurações → Integrações.");
  } else if (!apiKey.startsWith("$aact_") && !apiKey.startsWith("$aatp_")) {
    errors.push(
      `ASAAS_API_KEY looks invalid (got "${apiKey.slice(0, 8)}…"). ` +
      "Production keys start with $aact_, sandbox keys start with $aatp_."
    );
  }

  if (!baseUrl.startsWith("https://")) {
    errors.push("ASAAS_BASE_URL must start with https://");
  }

  if (!webhookToken) {
    // Warn but don't block — webhooks are optional during local dev
    console.warn(
      "[billing/config] ASAAS_WEBHOOK_TOKEN is not set. " +
      "Incoming webhooks will not be validated and will be rejected."
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `[billing/config] Invalid billing configuration:\n${errors.map(e => `  • ${e}`).join("\n")}\n` +
      "See .env.local.example for the required variables."
    );
  }

  _cached = {
    asaas: { apiKey, baseUrl, webhookToken, userAgent },
  };

  return _cached;
}

/**
 * Returns true when the Asaas key points to the sandbox environment.
 * Useful for logging / alerting.
 */
export function isAsaasSandbox(): boolean {
  const key = process.env.ASAAS_API_KEY ?? "";
  return key.startsWith("$aatp_") || (process.env.ASAAS_BASE_URL ?? "").includes("sandbox");
}

/** Expose config validation result without throwing — for health-check endpoints. */
export function validateBillingConfig(): { ok: boolean; errors: string[] } {
  try {
    getBillingConfig();
    return { ok: true, errors: [] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, errors: [msg] };
  }
}
