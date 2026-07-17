import { apiErrors, ApiError } from "@/platform/http/api-error";
import { createApiRoute } from "@/platform/http/create-api-route";
import { env } from "@/platform/config/env";

export const runtime = "nodejs";

// Proxies a Google Place Photo so the API key never reaches the browser.
// `name` is the Places photo resource, e.g. "places/XXX/photos/YYY".
export const GET = createApiRoute("media.photo", async (request) => {
  const name = new URL(request.url).searchParams.get("name");
  const key = env.googlePlacesApiKey;

  if (!name || !/^places\/[^/]+\/photos\/[^/]+$/.test(name)) {
    throw apiErrors.badRequest("Invalid photo reference.");
  }
  if (!key) {
    throw apiErrors.notFound("Photos not configured.");
  }

  const upstream = await fetch(
    `https://places.googleapis.com/v1/${name}/media?maxHeightPx=600&maxWidthPx=800&key=${key}`,
    { redirect: "follow" }
  );
  if (!upstream.ok || !upstream.body) {
    throw new ApiError(502, "upstream_unavailable", "Photo unavailable.");
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
      "cache-control": "public, max-age=86400",
    },
  });
});
