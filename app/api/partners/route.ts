/**
 * GET  /api/partners — list all partners
 * POST /api/partners — create a partner and trigger billing sync
 */

import { NextRequest, NextResponse } from "next/server";
import { createPartner, listPartners } from "@/lib/partners/service";
import { logger, newRequestId } from "@/lib/logger";

// -------------------------------------------------------------------------- //
// GET /api/partners
// -------------------------------------------------------------------------- //

export async function GET(): Promise<NextResponse> {
  const partners = listPartners();
  return NextResponse.json({ data: partners, total: partners.length });
}

// -------------------------------------------------------------------------- //
// POST /api/partners
// -------------------------------------------------------------------------- //

interface CreatePartnerBody {
  name?: unknown;
  cpfCnpj?: unknown;
  email?: unknown;
  phone?: unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = newRequestId();
  const log = logger.child({ request_id: requestId, route: "POST /api/partners" });

  let body: CreatePartnerBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  const errors: string[] = [];
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    errors.push("name is required");
  }
  if (!body.cpfCnpj || typeof body.cpfCnpj !== "string") {
    errors.push("cpfCnpj is required");
  } else {
    const digits = body.cpfCnpj.replace(/\D/g, "");
    if (digits.length !== 11 && digits.length !== 14) {
      errors.push("cpfCnpj must be a valid CPF (11 digits) or CNPJ (14 digits)");
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
  }

  try {
    const partner = await createPartner({
      name: (body.name as string).trim(),
      cpfCnpj: body.cpfCnpj as string,
      email: typeof body.email === "string" ? body.email.trim() : undefined,
      phone: typeof body.phone === "string" ? body.phone.trim() : undefined,
    });

    log.info("partner.api.created", { partner_id: partner.id });
    return NextResponse.json({ data: partner }, { status: 201 });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";

    // Duplicate CPF/CNPJ — business conflict, not a 500
    if (message.includes("already exists")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    log.error("partner.api.create_failed", { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
