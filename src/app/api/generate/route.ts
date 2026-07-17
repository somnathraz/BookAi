import { NextResponse } from "next/server";

import { generateSite } from "@/lib/template";
import { aiGenerateSite } from "@/lib/ai/generate";
import { aiAvailable } from "@/lib/ai/provider";
import {
  addSite,
  canGenerate,
  getSiteById,
  siteCount,
  updateSite,
  FREE_SITE_LIMIT,
} from "@/lib/accounts";
import { mergeSiteOnUpdate } from "@/lib/merge-site-update";
import { applyDefaultBooking } from "@/lib/booking-defaults";
import { ipFromRequest } from "@/lib/abuse";
import { enforceRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { emailFromRequest } from "@/lib/session";
import { getPublicSitePath, getPublicSiteUrl } from "@/lib/site-url";
import { sendPublishLifecycleEmails } from "@/lib/lifecycle";
import type { GeneratorInput, SiteData } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type GenerateBody = GeneratorInput & { siteId?: string };

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "generate");
  if (!limited.allowed) return rateLimitResponse(limited);

  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json(
      { error: "Email verification required.", code: "verify_required" },
      { status: 401 }
    );
  }

  const ip = ipFromRequest(request);

  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const siteId = body.siteId?.trim() || undefined;
  const isUpdate = Boolean(siteId);

  if (!isUpdate) {
    const gate = await canGenerate(email, ip);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.reason, code: "limit_reached" },
        { status: 402 }
      );
    }
  }

  if (!body?.name?.trim()) {
    return NextResponse.json(
      { error: "A name or business name is required." },
      { status: 400 }
    );
  }

  const { siteId: _omit, ...input } = body;
  const normalized: GeneratorInput = {
    ...input,
    domain: input.domain ?? "other",
    theme: input.theme ?? "light",
  };

  const wantAI = normalized.useAI !== false && aiAvailable();
  let generated: SiteData;
  let engine: "ai" | "template" = "template";

  if (wantAI) {
    try {
      generated = await aiGenerateSite(normalized);
      engine = "ai";
    } catch {
      generated = generateSite(normalized);
    }
  } else {
    generated = generateSite(normalized);
  }

  if (!isUpdate) {
    generated = applyDefaultBooking(generated, email);
  }

  const host = request.headers.get("host");

  if (isUpdate && siteId) {
    const existing = await getSiteById(email, siteId);
    if (!existing) {
      return NextResponse.json({ error: "Site not found." }, { status: 404 });
    }
    const site = mergeSiteOnUpdate(existing.site, generated, normalized);
    const stored = await updateSite(email, siteId, site);
    if (!stored) {
      return NextResponse.json({ error: "Site not found." }, { status: 404 });
    }
    return NextResponse.json({
      site,
      engine,
      updated: true,
      siteId: stored.id,
      slug: stored.slug,
      path: getPublicSitePath(stored.slug),
      url: getPublicSiteUrl(stored.slug, { host }),
      usage: { used: await siteCount(email), limit: FREE_SITE_LIMIT },
    });
  }

  const stored = await addSite(email, ip, generated);
  void sendPublishLifecycleEmails(
    email,
    { id: stored.id, slug: stored.slug, name: stored.name },
    host
  ).catch((err) => console.error("[lifecycle] publish email failed", err));
  return NextResponse.json({
    site: generated,
    engine,
    updated: false,
    siteId: stored.id,
    slug: stored.slug,
    path: getPublicSitePath(stored.slug),
    url: getPublicSiteUrl(stored.slug, { host }),
    usage: { used: await siteCount(email), limit: FREE_SITE_LIMIT },
  });
}
