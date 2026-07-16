import { NextResponse } from "next/server";

import {
  businessSearchAvailable,
  searchBusinesses,
} from "@/lib/business-search";
import { enforceRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "extract");
  if (!limited.allowed) return rateLimitResponse(limited);

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3) {
    return NextResponse.json(
      { error: "Enter a business name and city." },
      { status: 400 }
    );
  }
  if (query.length > 140) {
    return NextResponse.json({ error: "That search is too long." }, { status: 400 });
  }
  if (!businessSearchAvailable()) {
    return NextResponse.json(
      { error: "Business search is not configured.", code: "search_unavailable" },
      { status: 503 }
    );
  }

  try {
    const results = await searchBusinesses(query);
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Business search failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
