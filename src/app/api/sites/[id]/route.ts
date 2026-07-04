import { NextResponse } from "next/server";

import { getSiteById } from "@/lib/accounts";
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

  return NextResponse.json({
    id: stored.id,
    slug: stored.slug,
    name: stored.name,
    domain: stored.domain,
    theme: stored.theme,
    accent: stored.accent,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
    site: stored.site,
  });
}
