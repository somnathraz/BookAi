import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Proxies a Google Place Photo so the API key never reaches the browser.
// `name` is the Places photo resource, e.g. "places/XXX/photos/YYY".
export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("name");
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();

  if (!name || !/^places\/[^/]+\/photos\/[^/]+$/.test(name)) {
    return NextResponse.json({ error: "Invalid photo reference." }, { status: 400 });
  }
  if (!key) {
    return NextResponse.json({ error: "Photos not configured." }, { status: 404 });
  }

  const upstream = await fetch(
    `https://places.googleapis.com/v1/${name}/media?maxHeightPx=600&maxWidthPx=800&key=${key}`,
    { redirect: "follow" }
  );
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Photo unavailable." }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
      "cache-control": "public, max-age=86400",
    },
  });
}
