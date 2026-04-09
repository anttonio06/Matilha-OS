/**
 * Partner service — business logic layer.
 *
 * This is the only module that coordinates between:
 *   - PartnerRepository (persistence)
 *   - BillingProvider   (external API)
 *   - IntegrationLogRepository (audit trail)
 *   - logger            (observability)
 *
 * Route handlers call this layer. They never touch the repository or
 * provider directly.
 */

import { randomUUID } from "crypto";
import type { CreatePartnerInput, Partner, UpdatePartnerInput } from "@/lib/partners/types";
import { canSync, nextRetryAt } from "@/lib/partners/types";
import { PartnerRepository } from "@/lib/partners/repository";
import { asaasProvider } from "@/lib/billing/asaas/provider";
import { IntegrationLogRepository } from "@/lib/integration-log/repository";
import { isRetryable } from "@/lib/billing/asaas/errors";
import { logger, newRequestId } from "@/lib/logger";

// -------------------------------------------------------------------------- //
// Create
// -------------------------------------------------------------------------- //

/**
 * Create a new partner and immediately trigger a billing sync.
 * The sync is fire-and-forget from the caller's perspective:
 * the partner is persisted first (PENDING state), then the sync runs.
 *
 * If the sync fails, the partner remains in FAILED state and can be retried.
 */
export async function createPartner(input: CreatePartnerInput): Promise<Partner> {
  const requestId = newRequestId();
  const log = logger.child({ request_id: requestId });

  // Normalise CPF/CNPJ to digits only
  const cpfCnpj = input.cpfCnpj.replace(/\D/g, "");

  // Guard: duplicate check at service level (repository also checks, but we
  // want a clean error message before touching the file)
  const existing = PartnerRepository.findByCpfCnpj(cpfCnpj);
  if (existing) {
    throw new Error(`Partner with CPF/CNPJ ${cpfCnpj} already exists (id: ${existing.id})`);
  }

  const now = new Date().toISOString();
  const partner: Partner = {
    id: randomUUID(),
    name: input.name,
    cpfCnpj,
    email: input.email,
    phone: input.phone,
    status: "active",
    billing_sync_status: "PENDING",
    billing_provider: "asaas",
    billing_retry_count: 0,
    created_at: now,
    updated_at: now,
  };

  PartnerRepository.create(partner);
  log.info("partner.created", { partner_id: partner.id, cpf_cnpj: cpfCnpj });

  // Trigger sync immediately (awaited so the caller gets the final status)
  return syncPartnerBilling(partner.id, requestId);
}

// -------------------------------------------------------------------------- //
// Read
// -------------------------------------------------------------------------- //

export function getPartner(id: string): Partner {
  const partner = PartnerRepository.findById(id);
  if (!partner) throw new Error(`Partner not found: ${id}`);
  return partner;
}

export function listPartners(): Partner[] {
  return PartnerRepository.list();
}

// -------------------------------------------------------------------------- //
// Update
// -------------------------------------------------------------------------- //

export function updatePartner(id: string, input: UpdatePartnerInput): Partner {
  const updated = PartnerRepository.update(id, input);
  if (!updated) throw new Error(`Partner not found: ${id}`);
  logger.info("partner.updated", { partner_id: id });
  return updated;
}

// -------------------------------------------------------------------------- //
// Billing sync
// -------------------------------------------------------------------------- //

/**
 * Synchronise a partner's billing identity with Asaas.
 *
 * State transitions:
 *   PENDING / FAILED → SYNCING → SYNCED  (on success)
 *                             → FAILED   (on error)
 */
export async function syncPartnerBilling(
  partnerId: string,
  requestId = newRequestId()
): Promise<Partner> {
  const log = logger.child({ partner_id: partnerId, request_id: requestId });
  let partner = PartnerRepository.findById(partnerId);
  if (!partner) throw new Error(`Partner not found: ${partnerId}`);

  if (!canSync(partner)) {
    log.warn("partner.sync.skipped", { billing_status: partner.billing_sync_status });
    return partner;
  }

  // Transition to SYNCING
  partner = PartnerRepository.update(partnerId, {
    billing_sync_status: "SYNCING",
  }) as Partner;

  log.info("partner.sync.started");

  try {
    const result = await asaasProvider.createOrFetchCustomer({
      partnerId: partner.id,
      name: partner.name,
      cpfCnpj: partner.cpfCnpj,
      email: partner.email,
      phone: partner.phone,
      existingExternalId: partner.billing_external_id,
    });

    // Success — transition to SYNCED
    partner = PartnerRepository.update(partnerId, {
      billing_sync_status: "SYNCED",
      billing_external_id: result.externalId,
      billing_synced_at: new Date().toISOString(),
      billing_last_error: undefined,
      billing_retry_count: 0,
      billing_retry_after: undefined,
    }) as Partner;

    IntegrationLogRepository.append({
      partner_id: partnerId,
      request_id: requestId,
      provider: "asaas",
      event: "customer.synced",
      status: "success",
      payload: { external_id: result.externalId },
    });

    log.info("partner.sync.success", { asaas_id: result.externalId });
    return partner;

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const retryable = isRetryable(err);
    const newRetryCount = (partner.billing_retry_count ?? 0) + 1;

    // Transition to FAILED
    partner = PartnerRepository.update(partnerId, {
      billing_sync_status: "FAILED",
      billing_last_error: errorMessage,
      billing_retry_count: newRetryCount,
      billing_retry_after: retryable ? nextRetryAt(newRetryCount) : undefined,
    }) as Partner;

    IntegrationLogRepository.append({
      partner_id: partnerId,
      request_id: requestId,
      provider: "asaas",
      event: "customer.sync_failed",
      status: "error",
      payload: { error: errorMessage, retryable, retry_count: newRetryCount },
    });

    log.error("partner.sync.failed", {
      error: errorMessage,
      retryable,
      retry_count: newRetryCount,
    });

    return partner;
  }
}

/**
 * Retry all partners whose billing sync has failed and whose retry window
 * has passed. Designed to be called by a scheduled job or cron endpoint.
 */
export async function retryFailedSyncs(): Promise<{ retried: number; succeeded: number }> {
  const candidates = PartnerRepository.findReadyForRetry();
  let succeeded = 0;

  for (const partner of candidates) {
    const result = await syncPartnerBilling(partner.id);
    if (result.billing_sync_status === "SYNCED") succeeded++;
  }

  logger.info("partner.sync.batch_retry", {
    retried: candidates.length,
    succeeded,
  });

  return { retried: candidates.length, succeeded };
}
