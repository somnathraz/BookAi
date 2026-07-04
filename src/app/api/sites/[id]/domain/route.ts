import { NextResponse } from "next/server";

import { getPlan, getSiteById } from "@/lib/accounts";
import {
  clearSiteCustomDomain,
  customDomainFromSite,
  customDomainTxtHost,
  setSiteCustomDomain,
  verifySiteCustomDomain,
} from "@/lib/custom-domain";
import { customDomainAllowed } from "@/lib/plan-features";
import { getSiteRootDomain } from "@/lib/site-url";
import { emailFromRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json({ error: "Not verified.", code: "verify_required" }, { status: 401 });
  }

  const { id } = await params;
  const stored = await getSiteById(email, id);
  if (!stored) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const state = customDomainFromSite(stored);
  const root = getSiteRootDomain();
  return NextResponse.json({
    ...state,
    cnameTarget: root ? `${stored.slug}.${root}` : null,
    txtHost: state.domain ? customDomainTxtHost(state.domain) : null,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json({ error: "Not verified.", code: "verify_required" }, { status: 401 });
  }

  const plan = await getPlan(email);
  if (!customDomainAllowed(plan)) {
    return NextResponse.json(
      { error: "Custom domains are available on Basic." },
      { status: 403 }
    );
  }

  const { id } = await params;
  let body: { domain?: string; clear?: boolean };
  try {
    body = (await request.json()) as { domain?: string; clear?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.clear) {
    const stored = await clearSiteCustomDomain(email, id);
    if (!stored) return NextResponse.json({ error: "Site not found." }, { status: 404 });
    return NextResponse.json(customDomainFromSite(stored));
  }

  const domain = body.domain?.trim();
  if (!domain) {
    return NextResponse.json({ error: "Domain is required." }, { status: 400 });
  }

  const result = await setSiteCustomDomain(email, id, domain);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const root = getSiteRootDomain();
  return NextResponse.json({
    ...customDomainFromSite(result.stored),
    verifyToken: result.verifyToken,
    txtHost: customDomainTxtHost(result.stored.customDomain!),
    cnameTarget: root ? `${result.stored.slug}.${root}` : null,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json({ error: "Not verified.", code: "verify_required" }, { status: 401 });
  }

  const plan = await getPlan(email);
  if (!customDomainAllowed(plan)) {
    return NextResponse.json(
      { error: "Custom domains are available on Basic." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const result = await verifySiteCustomDomain(email, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(customDomainFromSite(result.stored));
}
