import { NextResponse } from "next/server";

import { isProxiableImageUrl } from "@/lib/image-proxy";
import { enforceRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";

export const runtime = "nodejs";

// Proxies external gallery images (Google / SerpAPI) so they load on generated sites.
export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "proxy");
  if (!limited.allowed) return rateLimitResponse(limited);

  const raw = new URL(request.url).searchParams.get("url");
  if (!raw || !isProxiableImageUrl(raw)) {
    return NextResponse.json({ error: "Invalid image URL." }, { status: 400 });
  }

  const upstream = await fetch(raw, {
    redirect: "follow",
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; PaperChaiBot/1.0)",
      referer: "https://www.google.com/",
    },
  });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Image unavailable." }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
      "cache-control": "public, max-age=86400",
    },
  });
}
