import "server-only";

import { getPlan, getSiteById } from "@/lib/accounts";
import {
  clearSiteCustomDomain,
  customDomainFromSite,
  customDomainTxtHost,
  setSiteCustomDomain,
  verifySiteCustomDomain,
} from "@/lib/custom-domain";
import { customDomainAllowed } from "@/lib/plan-features";
import { getSiteRootDomain } from "@/lib/site-url";
import { apiErrors } from "@/platform/http/api-error";

function domainInstructions(slug: string, domain: string | undefined) {
  const root = getSiteRootDomain();
  return {
    cnameTarget: root ? `${slug}.${root}` : null,
    txtHost: domain ? customDomainTxtHost(domain) : null,
  };
}

export async function getOwnedCustomDomain(email: string, siteId: string) {
  const stored = await getSiteById(email, siteId);
  if (!stored) throw apiErrors.notFound("Site not found.");
  const state = customDomainFromSite(stored);
  return { ...state, ...domainInstructions(stored.slug, state.domain) };
}

export async function updateOwnedCustomDomain(
  email: string,
  siteId: string,
  input: { domain?: string; clear?: boolean }
) {
  const plan = await getPlan(email);
  if (!customDomainAllowed(plan)) {
    throw apiErrors.forbidden("Custom domains are available on Basic.");
  }

  if (input.clear) {
    const stored = await clearSiteCustomDomain(email, siteId);
    if (!stored) throw apiErrors.notFound("Site not found.");
    return customDomainFromSite(stored);
  }

  const domain = input.domain?.trim();
  if (!domain) throw apiErrors.badRequest("Domain is required.");
  const result = await setSiteCustomDomain(email, siteId, domain);
  if ("error" in result) throw apiErrors.badRequest(result.error);

  const state = customDomainFromSite(result.stored);
  return {
    ...state,
    verifyToken: result.verifyToken,
    ...domainInstructions(result.stored.slug, result.stored.customDomain),
  };
}

export async function verifyOwnedCustomDomain(email: string, siteId: string) {
  const plan = await getPlan(email);
  if (!customDomainAllowed(plan)) {
    throw apiErrors.forbidden("Custom domains are available on Basic.");
  }

  const result = await verifySiteCustomDomain(email, siteId);
  if (!result.ok) throw apiErrors.badRequest(result.error);
  return customDomainFromSite(result.stored);
}
