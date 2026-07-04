import { NextResponse } from "next/server";

import { emailFromRequest } from "@/lib/session";
import { deleteSite, getPlan, listSites, planLimit } from "@/lib/accounts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json({ error: "Not verified.", code: "verify_required" }, { status: 401 });
  }
  const plan = await getPlan(email);
  const sites = (await listSites(email)).map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    domain: s.domain,
    theme: s.theme,
    accent: s.accent,
    customDomain: s.customDomainVerified ? s.customDomain : undefined,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
  return NextResponse.json({ email, sites, plan, limit: planLimit(plan) });
}

export async function DELETE(request: Request) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json({ error: "Not verified.", code: "verify_required" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing site id." }, { status: 400 });
  }
  const ok = await deleteSite(email, id);
  return NextResponse.json({ ok });
}
