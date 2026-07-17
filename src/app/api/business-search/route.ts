import { NextResponse } from "next/server";

import { searchBusinessDirectory } from "@/features/business-search/application/search-businesses";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const GET = createApiRoute("business-search.query", async (request) => {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const results = await searchBusinessDirectory(query);
  return NextResponse.json({ results });
});
