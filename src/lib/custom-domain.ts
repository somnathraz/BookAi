import "server-only";

import { randomBytes } from "crypto";
import { resolveTxt } from "dns/promises";

import {
  getSiteById,
  isCustomDomainTaken,
  patchSiteCustomDomain,
  type StoredSite,
} from "@/lib/accounts";
import { ensureSchema, getSql } from "@/lib/db";

const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function normalizeCustomDomain(raw: string): string | null {
  let s = raw.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
  if (s.startsWith("www.")) s = s.slice(4);
  if (!s || s.length > 253 || !DOMAIN_RE.test(s)) return null;
  return s;
}

export function customDomainTxtHost(domain: string): string {
  return `_paperchai-verification.${domain}`;
}

export function hostsForCustomDomain(domain: string): string[] {
  return [domain, `www.${domain}`];
}

function hostMatchesDomain(host: string, domain: string): boolean {
  const h = host.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  const d = domain.toLowerCase();
  return h === d || h === `www.${d}`;
}

const memSlugByHost = new Map<string, string>();

export function registerMemCustomDomain(domain: string, slug: string): void {
  for (const h of hostsForCustomDomain(domain)) {
    memSlugByHost.set(h, slug);
  }
}

export function unregisterMemCustomDomain(domain: string): void {
  for (const h of hostsForCustomDomain(domain)) {
    memSlugByHost.delete(h);
  }
}

/** Public lookup for proxy routing — verified custom domain → site slug. */
export async function getSiteSlugByVerifiedHost(host: string): Promise<string | null> {
  const hostname = host.split(":")[0].toLowerCase().replace(/\.$/, "");

  const mem = memSlugByHost.get(hostname);
  if (mem) return mem;

  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<{ slug: string; custom_domain: string }[]>`
      select slug, custom_domain from sites
       where custom_domain_verified = true
         and custom_domain is not null`;
    for (const row of rows) {
      if (hostMatchesDomain(hostname, row.custom_domain)) return row.slug;
    }
  }
  return null;
}

export interface CustomDomainState {
  domain?: string;
  verified: boolean;
  verifyToken?: string;
}

export function customDomainFromSite(stored: StoredSite): CustomDomainState {
  return {
    domain: stored.customDomain,
    verified: Boolean(stored.customDomainVerified),
    verifyToken: stored.customDomainVerifyToken,
  };
}

export async function setSiteCustomDomain(
  email: string,
  siteId: string,
  rawDomain: string
): Promise<{ stored: StoredSite; verifyToken: string } | { error: string }> {
  const domain = normalizeCustomDomain(rawDomain);
  if (!domain) return { error: "Enter a valid domain like example.com" };

  const existing = await getSiteById(email, siteId);
  if (!existing) return { error: "Site not found." };

  if (await isCustomDomainTaken(domain, siteId)) {
    return { error: "This domain is already connected to another site." };
  }

  const verifyToken =
    existing.customDomain === domain && existing.customDomainVerifyToken
      ? existing.customDomainVerifyToken
      : randomBytes(16).toString("hex");

  if (existing.customDomain && existing.customDomain !== domain) {
    unregisterMemCustomDomain(existing.customDomain);
  }

  const stored = await patchSiteCustomDomain(email, siteId, {
    customDomain: domain,
    customDomainVerified: false,
    customDomainVerifyToken: verifyToken,
  });
  if (!stored) return { error: "Site not found." };
  return { stored, verifyToken };
}

export async function clearSiteCustomDomain(
  email: string,
  siteId: string
): Promise<StoredSite | null> {
  const existing = await getSiteById(email, siteId);
  if (!existing) return null;
  if (existing.customDomain) unregisterMemCustomDomain(existing.customDomain);

  return patchSiteCustomDomain(email, siteId, {
    customDomain: null,
    customDomainVerified: false,
    customDomainVerifyToken: null,
  });
}

export async function verifySiteCustomDomain(
  email: string,
  siteId: string
): Promise<{ ok: true; stored: StoredSite } | { ok: false; error: string }> {
  const stored = await getSiteById(email, siteId);
  if (!stored?.customDomain || !stored.customDomainVerifyToken) {
    return { ok: false, error: "Add a domain first." };
  }

  const txtHost = customDomainTxtHost(stored.customDomain);
  const verified = await txtIncludesToken(txtHost, stored.customDomainVerifyToken);
  if (!verified) {
    return {
      ok: false,
      error: `TXT record not found yet. Add _paperchai-verification.${stored.customDomain} and try again in a few minutes.`,
    };
  }

  const updated = await patchSiteCustomDomain(email, siteId, {
    customDomain: stored.customDomain,
    customDomainVerified: true,
    customDomainVerifyToken: stored.customDomainVerifyToken,
  });
  if (!updated) return { ok: false, error: "Site not found." };

  registerMemCustomDomain(updated.customDomain!, updated.slug);
  return { ok: true, stored: updated };
}

async function txtIncludesToken(host: string, token: string): Promise<boolean> {
  try {
    const chunks = await resolveTxt(host);
    const flat = chunks.map((c) => c.join("")).join("");
    return flat.includes(token);
  } catch {
    return false;
  }
}
