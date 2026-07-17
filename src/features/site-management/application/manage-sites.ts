import "server-only";

import { deleteSite, getPlan, getSiteById, listSites, planLimit } from "@/lib/accounts";
import { unregisterMemCustomDomain } from "@/lib/custom-domain";
import { ApiError } from "@/platform/http/api-error";

export async function listOwnedSites(email: string) {
  const plan = await getPlan(email);
  const sites = (await listSites(email)).map((site) => ({
    id: site.id,
    slug: site.slug,
    name: site.name,
    domain: site.domain,
    theme: site.theme,
    accent: site.accent,
    customDomain: site.customDomainVerified ? site.customDomain : undefined,
    createdAt: site.createdAt,
    updatedAt: site.updatedAt,
  }));
  return { sites, plan, limit: planLimit(plan) };
}

export async function getOwnedSite(email: string, siteId: string) {
  const stored = await getSiteById(email, siteId);
  if (!stored) throw new ApiError(404, "site_not_found", "Site not found.");
  return {
    id: stored.id,
    slug: stored.slug,
    name: stored.name,
    domain: stored.domain,
    theme: stored.theme,
    accent: stored.accent,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
    site: stored.site,
  };
}

export async function deleteOwnedSite(email: string, siteId: string) {
  const deleted = await deleteSite(email, siteId);
  if (!deleted) {
    throw new ApiError(404, "site_not_found", "Site not found or already deleted.");
  }
  if (deleted.customDomain) unregisterMemCustomDomain(deleted.customDomain);
  return deleted;
}

