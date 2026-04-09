/**
 * GET    /api/partners/[id] — get partner details
 * PATCH  /api/partners/[id] — update partner fields
 * DELETE /api/partners/[id] — delete partner
 */

import { NextRequest, NextResponse } from "next/server";
import { getPartner, updatePartner } from "@/lib/partners/service";
import { PartnerRepository } from "@/lib/partners/repository";
import { logger, newRequestId } from "@/lib/logger";

interface RouteContext {
  params: { id: string };
}

// -------------------------------------------------------------------------- //
// GET /api/partners/[id]
// -------------------------------------------------------------------------- //

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const partner = getPartner(params.id);
    return NextResponse.json({ data: partner });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not found";
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// -------------------------------------------------------------------------- //
// PATCH /api/partners/[id]
// -------------------------------------------------------------------------- //

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const requestId = newRequestId();
  const log = logger.child({ request_id: requestId, partner_id: params.id });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const updated = updatePartner(params.id, {
      name: typeof body.name === "string" ? body.name.trim() : undefined,
      email: typeof body.email === "string" ? body.email.trim() : undefined,
      phone: typeof body.phone === "string" ? body.phone.trim() : undefined,
      status: body.status as "active" | "inactive" | "suspended" | undefined,
    });
    log.info("partner.api.updated");
    return NextResponse.json({ data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    log.error("partner.api.update_failed", { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// -------------------------------------------------------------------------- //
// DELETE /api/partners/[id]
// -------------------------------------------------------------------------- //

export async function DELETE(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const deleted = PartnerRepository.delete(params.id);
  if (!deleted) {
    return NextResponse.json({ error: `Partner not found: ${params.id}` }, { status: 404 });
  }
  logger.info("partner.api.deleted", { partner_id: params.id });
  return new NextResponse(null, { status: 204 });
}
