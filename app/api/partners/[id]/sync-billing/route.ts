/**
 * POST /api/partners/[id]/sync-billing
 *
 * Manually trigger (or re-trigger) the billing sync for a partner.
 * Returns the updated partner with the new billing status.
 *
 * Use cases:
 *   - First sync after partner creation (auto-called by createPartner)
 *   - Manual retry after a FAILED sync
 *   - Re-sync after data update (e.g. name change)
 */

import { NextRequest, NextResponse } from "next/server";
import { syncPartnerBilling } from "@/lib/partners/service";
import { PartnerRepository } from "@/lib/partners/repository";
import { logger, newRequestId } from "@/lib/logger";

interface RouteContext {
  params: { id: string };
}

export async function POST(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const requestId = newRequestId();
  const log = logger.child({ request_id: requestId, partner_id: params.id });

  const partner = PartnerRepository.findById(params.id);
  if (!partner) {
    return NextResponse.json({ error: `Partner not found: ${params.id}` }, { status: 404 });
  }

  // If already syncing, don't start another concurrent sync
  if (partner.billing_sync_status === "SYNCING") {
    return NextResponse.json(
      { error: "Sync already in progress", data: partner },
      { status: 409 }
    );
  }

  log.info("partner.sync.manual_trigger");

  try {
    const updated = await syncPartnerBilling(params.id, requestId);
    const status = updated.billing_sync_status === "SYNCED" ? 200 : 502;
    return NextResponse.json({ data: updated }, { status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    log.error("partner.sync.manual_failed", { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
