import "server-only";

import {
  addSite,
  canGenerate,
  FREE_SITE_LIMIT,
  getSiteById,
  siteCount,
  updateSite,
} from "@/lib/accounts";
import { aiGenerateSite } from "@/lib/ai/generate";
import { aiAvailable } from "@/lib/ai/provider";
import { applyDefaultBooking } from "@/lib/booking-defaults";
import { sendPublishLifecycleEmails } from "@/lib/lifecycle";
import { mergeSiteOnUpdate } from "@/lib/merge-site-update";
import { getPublicSitePath, getPublicSiteUrl } from "@/lib/site-url";
import { generateSite } from "@/lib/template";
import type { GeneratorInput, SiteData } from "@/lib/types";
import { ApiError } from "@/platform/http/api-error";
import { logger } from "@/platform/logging/logger.server";

export interface GenerateSiteCommand {
  email: string;
  ip?: string;
  host?: string;
  siteId?: string;
  input: GeneratorInput;
}

export interface GenerateSiteResult {
  site: SiteData;
  engine: "ai" | "template";
  updated: boolean;
  siteId: string;
  slug: string;
  path: string;
  url: string;
  usage: { used: number; limit: number };
}

/**
 * Application service for preview-approved site generation. The HTTP route
 * performs only parsing and policy enforcement; this service owns the business
 * flow and will later depend on a site repository instead of the legacy store.
 */
export async function generateAndStoreSite(
  command: GenerateSiteCommand
): Promise<GenerateSiteResult> {
  const { email, ip, host, siteId, input } = command;
  const isUpdate = Boolean(siteId);

  if (!isUpdate) {
    const gate = await canGenerate(email, ip);
    if (!gate.ok) {
      throw new ApiError(
        402,
        "limit_reached",
        gate.reason ?? "You've reached your current site limit."
      );
    }
  }

  const wantAI = input.useAI !== false && aiAvailable();
  let generated: SiteData;
  let engine: "ai" | "template" = "template";

  if (wantAI) {
    try {
      generated = await aiGenerateSite(input);
      engine = "ai";
    } catch {
      // Generation remains useful during a provider outage; the deterministic
      // template fallback is intentionally part of the product contract.
      generated = generateSite(input);
    }
  } else {
    generated = generateSite(input);
  }

  if (!isUpdate) generated = applyDefaultBooking(generated, email);

  if (siteId) {
    const existing = await getSiteById(email, siteId);
    if (!existing) throw new ApiError(404, "site_not_found", "Site not found.");
    const site = mergeSiteOnUpdate(existing.site, generated, input);
    const stored = await updateSite(email, siteId, site);
    if (!stored) throw new ApiError(404, "site_not_found", "Site not found.");
    return {
      site,
      engine,
      updated: true,
      siteId: stored.id,
      slug: stored.slug,
      path: getPublicSitePath(stored.slug),
      url: getPublicSiteUrl(stored.slug, { host }),
      usage: { used: await siteCount(email), limit: FREE_SITE_LIMIT },
    };
  }

  const stored = await addSite(email, ip, generated);
  void sendPublishLifecycleEmails(
    email,
    { id: stored.id, slug: stored.slug, name: stored.name },
    host
  ).catch(() => {
    logger.warn("site-generation.lifecycle-email.failed", { siteId: stored.id });
  });

  return {
    site: generated,
    engine,
    updated: false,
    siteId: stored.id,
    slug: stored.slug,
    path: getPublicSitePath(stored.slug),
    url: getPublicSiteUrl(stored.slug, { host }),
    usage: { used: await siteCount(email), limit: FREE_SITE_LIMIT },
  };
}
