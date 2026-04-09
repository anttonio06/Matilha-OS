/**
 * Normalise Asaas API request/response shapes to internal types.
 *
 * Nothing outside this file should know the exact field names that Asaas uses.
 * All translating happens here — if Asaas changes a field name or adds a new
 * status, only this file needs updating.
 */

import type {
  CreateCustomerInput,
  CreateCustomerOutput,
  CreatePaymentInput,
  CreatePaymentOutput,
  NormalisedWebhookEvent,
  WebhookEventType,
} from "@/lib/billing/types";

// -------------------------------------------------------------------------- //
// Asaas raw API shapes (kept private — not exported from this module)
// -------------------------------------------------------------------------- //

interface AsaasCustomerBody {
  name: string;
  cpfCnpj: string;
  email?: string;
  mobilePhone?: string;
  notificationDisabled?: boolean;
}

interface AsaasCustomerResponse {
  id: string;
  name: string;
  cpfCnpj: string;
  email?: string;
  dateCreated?: string;
  deleted?: boolean;
  [key: string]: unknown;
}

interface AsaasPaymentBody {
  customer: string;           // Asaas customer ID
  billingType: string;
  value: number;
  dueDate: string;            // yyyy-MM-dd
  description?: string;
}

interface AsaasPaymentResponse {
  id: string;
  status: string;
  invoiceUrl?: string;
  pixQrCode?: { encodedImage?: string; payload?: string };
  bankSlipUrl?: string;
  [key: string]: unknown;
}

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer?: string;
    value?: number;
    status?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// -------------------------------------------------------------------------- //
// Customer mappers
// -------------------------------------------------------------------------- //

export function toAsaasCustomerBody(input: CreateCustomerInput): AsaasCustomerBody {
  return {
    name: input.name,
    cpfCnpj: input.cpfCnpj,
    email: input.email,
    mobilePhone: input.phone,
    notificationDisabled: false,
  };
}

export function fromAsaasCustomerResponse(raw: AsaasCustomerResponse): CreateCustomerOutput {
  return {
    externalId: raw.id,
    status: raw.deleted ? "inactive" : "active",
    createdAt: raw.dateCreated,
    raw: raw as unknown as Record<string, unknown>,
  };
}

// -------------------------------------------------------------------------- //
// Payment mappers
// -------------------------------------------------------------------------- //

export function toAsaasPaymentBody(input: CreatePaymentInput): AsaasPaymentBody {
  return {
    customer: input.externalCustomerId,
    billingType: input.billingType,
    value: input.value,
    dueDate: input.dueDate,
    description: input.description,
  };
}

export function fromAsaasPaymentResponse(raw: AsaasPaymentResponse): CreatePaymentOutput {
  return {
    externalId: raw.id,
    status: raw.status,
    invoiceUrl: raw.invoiceUrl,
    pixQrCode: raw.pixQrCode?.encodedImage,
    pixCopiaECola: raw.pixQrCode?.payload,
    boletoUrl: raw.bankSlipUrl,
    raw: raw as unknown as Record<string, unknown>,
  };
}

// -------------------------------------------------------------------------- //
// Webhook mappers
// -------------------------------------------------------------------------- //

const WEBHOOK_EVENT_MAP: Record<string, WebhookEventType> = {
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  PAYMENT_CONFIRMED: "PAYMENT_CONFIRMED",
  PAYMENT_OVERDUE: "PAYMENT_OVERDUE",
  PAYMENT_DELETED: "PAYMENT_DELETED",
  PAYMENT_REFUNDED: "PAYMENT_REFUNDED",
  PAYMENT_AWAITING_RISK_ANALYSIS: "PAYMENT_AWAITING_RISK_ANALYSIS",
};

export function fromAsaasWebhookPayload(raw: Record<string, unknown>): NormalisedWebhookEvent {
  const payload = raw as AsaasWebhookPayload;
  const type: WebhookEventType = WEBHOOK_EVENT_MAP[payload.event] ?? "UNKNOWN";

  return {
    type,
    externalPaymentId: payload.payment?.id ?? "",
    externalCustomerId: payload.payment?.customer,
    value: payload.payment?.value,
    status: payload.payment?.status,
    raw,
  };
}
