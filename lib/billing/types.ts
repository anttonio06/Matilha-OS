/**
 * BillingProvider abstraction layer.
 *
 * All billing providers (Asaas, Stripe, PagSeguro, etc.) implement this
 * interface so the rest of the application never depends on a specific vendor.
 *
 * Architecture decision: thin interface + mapper pattern.
 * Each provider translates its own API models into these internal types.
 * Adding a new provider = implement BillingProvider, register in factory.
 */

// -------------------------------------------------------------------------- //
// Status machine
// -------------------------------------------------------------------------- //

/**
 * Lifecycle of a partner's billing sync with an external provider.
 *
 * Transitions:
 *   PENDING   → SYNCING   (sync triggered)
 *   SYNCING   → SYNCED    (external customer created successfully)
 *   SYNCING   → FAILED    (API error, network error, or validation rejection)
 *   FAILED    → SYNCING   (manual or automatic retry)
 *   SYNCED    → SYNCING   (re-sync requested, e.g. data change)
 */
export type BillingSyncStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED";

// -------------------------------------------------------------------------- //
// Input / Output types
// -------------------------------------------------------------------------- //

export interface CreateCustomerInput {
  /** Internal unique identifier for the partner */
  partnerId: string;
  /** Full legal name or business name */
  name: string;
  /** CPF (11 digits) or CNPJ (14 digits), digits only */
  cpfCnpj: string;
  email?: string;
  phone?: string;
  /** Used in duplicate-check before creating */
  existingExternalId?: string;
}

export interface CreateCustomerOutput {
  /** ID returned by the external billing system (e.g. Asaas customer ID) */
  externalId: string;
  /** Normalised status returned or inferred from the provider */
  status: "active" | "inactive";
  /** ISO 8601 timestamp from the provider's response */
  createdAt?: string;
  /** Raw provider payload — stored for auditing, never relied on for logic */
  raw?: Record<string, unknown>;
}

export interface CreatePaymentInput {
  externalCustomerId: string;
  description: string;
  /** Value in BRL (e.g. 99.90) */
  value: number;
  /** ISO 8601 date string, e.g. "2024-12-31" */
  dueDate: string;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD";
  /** Idempotency key — provider may use this to deduplicate */
  idempotencyKey?: string;
}

export interface CreatePaymentOutput {
  externalId: string;
  status: string;
  invoiceUrl?: string;
  pixQrCode?: string;
  pixCopiaECola?: string;
  boletoUrl?: string;
  raw?: Record<string, unknown>;
}

// -------------------------------------------------------------------------- //
// Provider interface
// -------------------------------------------------------------------------- //

export interface BillingProvider {
  readonly name: string;

  /**
   * Create or retrieve an existing customer in the external billing system.
   * Must be idempotent: if a customer with the same cpfCnpj already exists,
   * return the existing record rather than creating a duplicate.
   */
  createOrFetchCustomer(input: CreateCustomerInput): Promise<CreateCustomerOutput>;

  /**
   * Create a payment/charge for an existing external customer.
   */
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentOutput>;

  /**
   * Validate the signature / token of an incoming webhook payload.
   * Returns true if the webhook is authentic.
   */
  validateWebhook(rawBody: string, headers: Record<string, string>): boolean;
}

// -------------------------------------------------------------------------- //
// Webhook event (normalised)
// -------------------------------------------------------------------------- //

export type WebhookEventType =
  | "PAYMENT_RECEIVED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_DELETED"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_AWAITING_RISK_ANALYSIS"
  | "UNKNOWN";

export interface NormalisedWebhookEvent {
  type: WebhookEventType;
  externalPaymentId: string;
  externalCustomerId?: string;
  value?: number;
  status?: string;
  raw: Record<string, unknown>;
}
