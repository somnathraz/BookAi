import { NextResponse } from "next/server";

import { getSiteById } from "@/lib/accounts";
import { getAccountFeedback, saveAccountFeedback } from "@/lib/feedback";
import { enforceRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { emailFromRequest } from "@/lib/session";

export const runtime = "nodejs";

const MAX_TEXT = 1200;
const MAX_TAGS = 20;

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "auth");
  if (!limited.allowed) return rateLimitResponse(limited);

  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const feedback = await getAccountFeedback(email);
  return NextResponse.json({ feedback });
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "auth");
  if (!limited.allowed) return rateLimitResponse(limited);

  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: {
    siteId?: string;
    rating?: number;
    experience?: string;
    desiredFeatures?: string;
    featureTags?: string[];
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rating = typeof body.rating === "number" ? body.rating : NaN;
  const experience = body.experience?.trim().slice(0, MAX_TEXT);
  const desiredFeatures = body.desiredFeatures?.trim().slice(0, MAX_TEXT);
  const featureTags = Array.isArray(body.featureTags)
    ? body.featureTags.map((t) => String(t).trim()).filter(Boolean).slice(0, MAX_TAGS)
    : [];
  const siteId = body.siteId?.trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Pick a rating from 1 to 5." }, { status: 400 });
  }

  if (siteId) {
    const site = await getSiteById(email, siteId);
    if (!site) {
      return NextResponse.json({ error: "Site not found." }, { status: 404 });
    }
  }

  const feedback = await saveAccountFeedback(email, {
    rating,
    experience,
    desiredFeatures,
    featureTags,
    siteId,
  });

  return NextResponse.json({ ok: true, feedback });
}
