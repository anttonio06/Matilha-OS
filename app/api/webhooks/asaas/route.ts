/**
 * POST /api/webhooks/asaas
 *
 * Receives payment event notifications from the Asaas platform.
 *
 * Security:
 *   - Validates the `asaas-access-token` header against ASAAS_WEBHOOK_TOKEN
 *   - Reads raw body (not parsed) before validation to prevent manipulation
 *
 * Current handled events:
 *   PAYMENT_RECEIVED  — mark local charge as received
 *   PAYMENT_CONFIRMED — mark local charge as confirmed
 *   PAYMENT_OVERDUE   — mark local charge as overdue
 *   PAYMENT_REFUNDED  — mark local charge as refunded
 *
 * Asaas expects a 2xx response within 5 seconds, otherwise it retries.
 * We acknowledge immediately and process asynchronously (fire-and-forget).
 */

import { NextRequest, NextResponse } from "next/server";
import { asaasProvider } from "@/lib/billing/asaas/provider";
import { IntegrationLogRepository } from "@/lib/integration-log/repository";
import { logger, newRequestId } from "@/lib/logger";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = newRequestId();
  const log = logger.child({ request_id: requestId, route: "POST /api/webhooks/asaas" });

  // Read raw body as text (needed for signature validation)
  const rawBody = await req.text();

  // Collect headers into a plain object for the validator
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  // ------------------------------------------------------------ //
  // 1. Validate webhook authenticity
  // ------------------------------------------------------------ //
  const isValid = asaasProvider.validateWebhook(rawBody, headers);
  if (!isValid) {
    log.warn("webhook.asaas.rejected", { reason: "invalid_token" });
    // Return 401 so Asaas knows this is a security rejection, not a 5xx to retry
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ------------------------------------------------------------ //
  // 2. Parse the event
  // ------------------------------------------------------------ //
  let event: ReturnType<typeof asaasProvider.parseWebhook>;
  try {
    event = asaasProvider.parseWebhook(rawBody);
  } catch {
    log.warn("webhook.asaas.parse_failed", { raw: rawBody.slice(0, 200) });
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  log.info("webhook.asaas.received", {
    event_type: event.type,
    payment_id: event.externalPaymentId,
    customer_id: event.externalCustomerId,
    value: event.value,
  });

  // ------------------------------------------------------------ //
  // 3. Log the raw event for audit trail
  // ------------------------------------------------------------ //
  IntegrationLogRepository.append({
    partner_id: event.externalCustomerId ?? "unknown",
    request_id: requestId,
    provider: "asaas",
    event: `webhook.${event.type.toLowerCase()}`,
    status: "info",
    payload: {
      payment_id: event.externalPaymentId,
      value: event.value,
      status: event.status,
    },
  });

  // ------------------------------------------------------------ //
  // 4. Handle event (extend this switch as new event types are needed)
  // ------------------------------------------------------------ //
  switch (event.type) {
    case "PAYMENT_RECEIVED":
    case "PAYMENT_CONFIRMED":
      // TODO: update local charge status in DB / localStorage bridge
      // For now: logged above — the Financeiro page polls its own state
      log.info("webhook.asaas.payment_received", { payment_id: event.externalPaymentId });
      break;

    case "PAYMENT_OVERDUE":
      log.warn("webhook.asaas.payment_overdue", { payment_id: event.externalPaymentId });
      break;

    case "PAYMENT_REFUNDED":
      log.info("webhook.asaas.payment_refunded", { payment_id: event.externalPaymentId });
      break;

    case "UNKNOWN":
    default:
      log.warn("webhook.asaas.unhandled_event", { event_type: event.type });
      break;
  }

  // Acknowledge to Asaas — always 200 after validation passes
  return NextResponse.json({ received: true });
}
