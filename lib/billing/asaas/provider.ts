/**
 * AsaasBillingProvider — concrete implementation of BillingProvider for Asaas.
 *
 * Responsibilities:
 *   1. Create or fetch a customer (idempotent via CPF/CNPJ lookup)
 *   2. Create a payment for a customer
 *   3. Validate incoming webhook signatures
 *
 * This class knows nothing about Partners or the database.
 * All persistence is handled by the calling service layer.
 */

import type {
  BillingProvider,
  CreateCustomerInput,
  CreateCustomerOutput,
  CreatePaymentInput,
  CreatePaymentOutput,
  NormalisedWebhookEvent,
} from "@/lib/billing/types";
import { asaasClient } from "@/lib/billing/asaas/client";
import {
  fromAsaasCustomerResponse,
  fromAsaasPaymentResponse,
  fromAsaasWebhookPayload,
  toAsaasCustomerBody,
  toAsaasPaymentBody,
} from "@/lib/billing/asaas/mappers";
import { AsaasApiError } from "@/lib/billing/asaas/errors";
import { getBillingConfig } from "@/lib/billing/config";
import { logger } from "@/lib/logger";

// -------------------------------------------------------------------------- //
// Asaas list-response shapes (used for duplicate check)
// -------------------------------------------------------------------------- //

interface AsaasListResponse<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
}

interface AsaasCustomerListItem {
  id: string;
  name: string;
  cpfCnpj: string;
  email?: string;
  dateCreated?: string;
  deleted?: boolean;
  [key: string]: unknown;
}

// -------------------------------------------------------------------------- //
// Provider
// -------------------------------------------------------------------------- //

export class AsaasBillingProvider implements BillingProvider {
  readonly name = "asaas";

  /**
   * Create or fetch a customer.
   *
   * Idempotency strategy:
   *   1. If `input.existingExternalId` is set, attempt to fetch that customer first.
   *      If found and active, return it without creating a new one.
   *   2. Otherwise, search by CPF/CNPJ before POSTing.
   *      Asaas does not enforce CPF/CNPJ uniqueness on its own for non-enterprise plans.
   *   3. Only create a new customer if no existing match is found.
   */
  async createOrFetchCustomer(input: CreateCustomerInput): Promise<CreateCustomerOutput> {
    const log = logger.child({ partner_id: input.partnerId, provider: this.name });

    // Step 1: If we already have an Asaas ID recorded locally, verify it's still active
    if (input.existingExternalId) {
      try {
        const existing = await asaasClient.get<AsaasCustomerListItem>(
          `/customers/${input.existingExternalId}`
        );
        if (existing && !existing.deleted) {
          log.info("billing.customer.fetched_existing", { asaas_id: existing.id });
          return fromAsaasCustomerResponse(existing);
        }
      } catch (err) {
        if (err instanceof AsaasApiError && err.statusCode === 404) {
          // Customer was deleted in Asaas — fall through to create a new one
          log.warn("billing.customer.existing_not_found", { asaas_id: input.existingExternalId });
        } else {
          throw err; // unexpected error — propagate
        }
      }
    }

    // Step 2: Search by CPF/CNPJ to prevent duplicates
    const digitsOnly = input.cpfCnpj.replace(/\D/g, "");
    try {
      const search = await asaasClient.get<AsaasListResponse<AsaasCustomerListItem>>(
        `/customers?cpfCnpj=${encodeURIComponent(digitsOnly)}&limit=1`
      );
      if (search.data.length > 0 && !search.data[0].deleted) {
        const found = search.data[0];
        log.info("billing.customer.found_by_cpfcnpj", { asaas_id: found.id, cpf_cnpj: digitsOnly });
        return fromAsaasCustomerResponse(found);
      }
    } catch (err) {
      // Search failure is non-fatal — proceed to creation
      log.warn("billing.customer.search_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Step 3: Create new customer
    log.info("billing.customer.creating", { cpf_cnpj: digitsOnly });
    const body = toAsaasCustomerBody({ ...input, cpfCnpj: digitsOnly });
    const created = await asaasClient.post<AsaasCustomerListItem>("/customers", body);
    log.info("billing.customer.created", { asaas_id: created.id });
    return fromAsaasCustomerResponse(created);
  }

  /**
   * Create a payment for an existing Asaas customer.
   * Passes `idempotencyKey` to prevent duplicate charges on retry.
   */
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
    const log = logger.child({ provider: this.name, customer: input.externalCustomerId });

    log.info("billing.payment.creating", {
      billing_type: input.billingType,
      value: input.value,
      due_date: input.dueDate,
    });

    const body = toAsaasPaymentBody(input);
    const raw = await asaasClient.post<Record<string, unknown>>(
      "/payments",
      body,
      { idempotencyKey: input.idempotencyKey }
    );

    const result = fromAsaasPaymentResponse(raw as Parameters<typeof fromAsaasPaymentResponse>[0]);
    log.info("billing.payment.created", { asaas_payment_id: result.externalId, status: result.status });
    return result;
  }

  /**
   * Validate an Asaas webhook.
   *
   * Asaas sends the webhook token in the `asaas-access-token` header.
   * We compare it against our configured ASAAS_WEBHOOK_TOKEN.
   */
  validateWebhook(_rawBody: string, headers: Record<string, string>): boolean {
    const config = getBillingConfig();
    if (!config.asaas.webhookToken) {
      logger.warn("billing.webhook.no_token_configured");
      return false;
    }
    const incoming = headers["asaas-access-token"] ?? headers["Asaas-Access-Token"] ?? "";
    return incoming === config.asaas.webhookToken;
  }

  /** Parse a raw webhook payload into a normalised event. */
  parseWebhook(rawBody: string): NormalisedWebhookEvent {
    const raw = JSON.parse(rawBody) as Record<string, unknown>;
    return fromAsaasWebhookPayload(raw);
  }
}

/** Singleton instance — reuse across requests in the same process. */
export const asaasProvider = new AsaasBillingProvider();
