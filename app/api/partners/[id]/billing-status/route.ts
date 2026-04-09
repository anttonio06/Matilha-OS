/**
 * GET /api/partners/[id]/billing-status
 *
 * Lightweight polling endpoint — returns only the billing fields.
 * The UI polls this after triggering a sync to show real-time status.
 *
 * Response shape:
 * {
 *   partner_id: string,
 *   billing_sync_status: BillingSyncStatus,
 *   billing_external_id?: string,
 *   billing_synced_at?: string,
 *   billing_last_error?: string,
 *   billing_retry_count: number
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { PartnerRepository } from "@/lib/partners/repository";
import { IntegrationLogRepository } from "@/lib/integration-log/repository";

interface RouteContext {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const partner = PartnerRepository.findById(params.id);
  if (!partner) {
    return NextResponse.json({ error: `Partner not found: ${params.id}` }, { status: 404 });
  }

  // Fetch the last 10 log entries for this partner for the UI timeline
  const recentLogs = IntegrationLogRepository.recent(10, params.id);

  return NextResponse.json({
    partner_id: partner.id,
    billing_sync_status: partner.billing_sync_status,
    billing_provider: partner.billing_provider,
    billing_external_id: partner.billing_external_id,
    billing_synced_at: partner.billing_synced_at,
    billing_last_error: partner.billing_last_error,
    billing_retry_count: partner.billing_retry_count,
    billing_retry_after: partner.billing_retry_after,
    recent_events: recentLogs,
  });
}
