import { NextResponse } from "next/server";

import { generateSite } from "@/lib/template";
import { aiGenerateSite } from "@/lib/ai/generate";
import { aiAvailable } from "@/lib/ai/provider";
import { emailFromRequest } from "@/lib/session";
import { addSite, canGenerate, siteCount, FREE_SITE_LIMIT } from "@/lib/accounts";
import { ipFromRequest } from "@/lib/abuse";
import { enforceRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { getPublicSitePath, getPublicSiteUrl } from "@/lib/site-url";
import type { GeneratorInput, SiteData } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "generate");
  if (!limited.allowed) return rateLimitResponse(limited);

  // Accounts model: generation always requires a verified email session.
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json(
      { error: "Email verification required.", code: "verify_required" },
      { status: 401 }
    );
  }

  const ip = ipFromRequest(request);

  // Free plan: one site per email, with a soft per-IP cap to resist abuse.
  const gate = await canGenerate(email, ip);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.reason, code: "limit_reached" },
      { status: 402 }
    );
  }

  let input: GeneratorInput;
  try {
    input = (await request.json()) as GeneratorInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!input?.name?.trim()) {
    return NextResponse.json(
      { error: "A name or business name is required." },
      { status: 400 }
    );
  }

  const normalized: GeneratorInput = {
    ...input,
    domain: input.domain ?? "other",
    theme: input.theme ?? "light",
  };

  // Template-first: AI writes the copy when a provider is configured AND the
  // user hasn't opted out. Falls back to the template engine on any failure so
  // generation never breaks.
  const wantAI = normalized.useAI !== false && aiAvailable();
  let site: SiteData;
  let engine: "ai" | "template" = "template";

  if (wantAI) {
    try {
      site = await aiGenerateSite(normalized);
      engine = "ai";
    } catch {
      site = generateSite(normalized);
    }
  } else {
    site = generateSite(normalized);
  }

  const stored = await addSite(email, ip, site);
  return NextResponse.json({
    site,
    engine,
    siteId: stored.id,
    slug: stored.slug,
    path: getPublicSitePath(stored.slug),
    url: getPublicSiteUrl(stored.slug),
    usage: { used: await siteCount(email), limit: FREE_SITE_LIMIT },
  });
}
