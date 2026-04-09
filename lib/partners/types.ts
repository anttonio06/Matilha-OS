/**
 * Partner entity — the core domain object for multi-tenant billing.
 *
 * A "partner" in Matilha OS is a school, clinic, or other business that
 * uses the platform. Each partner may optionally have a billing identity
 * (Asaas customer) so the platform can collect subscription fees.
 *
 * Fields prefixed `billing_` are populated after a successful sync.
 */

import type { BillingSyncStatus } from "@/lib/billing/types";

export interface Partner {
  /** Internal UUID, generated on creation */
  id: string;

  // --- Identity ----------------------------------------------------------- //
  name: string;
  /** CPF (11 digits) or CNPJ (14 digits), digits only — stored normalised */
  cpfCnpj: string;
  email?: string;
  phone?: string;
  /** Active / inactive / suspended */
  status: "active" | "inactive" | "suspended";

  // --- Billing sync ------------------------------------------------------- //
  billing_sync_status: BillingSyncStatus;
  /** Which billing provider owns this customer record */
  billing_provider?: "asaas";
  /** External customer ID, e.g. Asaas `cus_000012345` */
  billing_external_id?: string;
  /** ISO 8601 — when the external customer was successfully created */
  billing_synced_at?: string;
  /** Human-readable error from the last failed sync attempt */
  billing_last_error?: string;
  /** Number of consecutive sync failures (reset on success) */
  billing_retry_count: number;
  /** ISO 8601 — when to next attempt a retry (for scheduled retry logic) */
  billing_retry_after?: string;

  // --- Audit -------------------------------------------------------------- //
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------------------------- //
// Input types (used by service layer)
// -------------------------------------------------------------------------- //

export interface CreatePartnerInput {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
}

export interface UpdatePartnerInput {
  name?: string;
  email?: string;
  phone?: string;
  status?: Partner["status"];
}

// -------------------------------------------------------------------------- //
// Helpers
// -------------------------------------------------------------------------- //

/** True when the partner is eligible for a billing sync attempt. */
export function canSync(partner: Partner): boolean {
  return (
    partner.status === "active" &&
    (partner.billing_sync_status === "PENDING" ||
      partner.billing_sync_status === "FAILED")
  );
}

/** Compute next retry timestamp using capped exponential back-off. */
export function nextRetryAt(retryCount: number): string {
  const BASE_S = 60;        // 1 minute
  const MAX_S = 86400;      // 24 hours
  const seconds = Math.min(BASE_S * Math.pow(2, retryCount), MAX_S);
  return new Date(Date.now() + seconds * 1000).toISOString();
}
