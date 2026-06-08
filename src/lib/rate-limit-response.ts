import { NextResponse } from "next/server";

import { RATE_LIMIT_MESSAGE, type RateLimitResult } from "@/lib/rate-limit";

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfter = result.retryAfterSec ?? 3600;
  return NextResponse.json(
    {
      error: RATE_LIMIT_MESSAGE,
      code: "rate_limited",
      retryAfter,
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  );
}
