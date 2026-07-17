import { isProxiableImageUrl } from "@/lib/image-proxy";
import { ApiError, apiErrors } from "@/platform/http/api-error";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

// Proxies external gallery images (Google / SerpAPI) so they load on generated sites.
export const GET = createApiRoute("media.proxy", async (request) => {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw || !isProxiableImageUrl(raw)) {
    throw apiErrors.badRequest("Invalid image URL.");
  }

  const upstream = await fetch(raw, {
    redirect: "follow",
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; PaperChaiBot/1.0)",
      referer: "https://www.google.com/",
    },
  });
  if (!upstream.ok || !upstream.body) {
    throw new ApiError(502, "upstream_unavailable", "Image unavailable.");
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
      "cache-control": "public, max-age=86400",
    },
  });
});
