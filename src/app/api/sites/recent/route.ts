import { NextResponse } from "next/server";

import { listRecentPublicSites } from "@/features/site-management/application/list-recent-public-sites";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const GET = createApiRoute("site.recent-public", async (request) => {
  const raw = new URL(request.url).searchParams.get("limit");
  const parsed = raw ? Number.parseInt(raw, 10) : 8;
  const limit = Number.isFinite(parsed) ? parsed : 8;
  const sites = await listRecentPublicSites(limit);
  return NextResponse.json({ sites });
});
