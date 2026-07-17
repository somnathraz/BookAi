// Public URLs for published sites.
//
//   Path mode (default):       paperchaiapp.com/glamzone
//   Subdomain mode (wildcard): glamzone.paperchaiapp.com
//
// Subdomain mode turns on automatically when NEXT_PUBLIC_SITE_DOMAIN is set
// (e.g. "paperchaiapp.com"). proxy.ts then rewrites <slug>.<domain> to
// the /[slug] route, so both URL styles keep working.

import { APP_DOMAIN } from "@/lib/brand";
import { publicEnv } from "@/platform/config/public-env";

function normalizeHost(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  return raw
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .toLowerCase();
}

/** Apex domain for the app — env override, then canonical default. */
export function getCanonicalAppDomain(): string {
  return (
    normalizeHost(publicEnv.siteDomain) ??
    normalizeHost(publicEnv.appUrl) ??
    APP_DOMAIN
  );
}

/** App origin for absolute links (emails, OG tags, copy-to-clipboard). */
export function getAppBaseUrl(): string {
  const configured = publicEnv.appUrl;
  if (configured) return configured.replace(/\/$/, "");
  if (publicEnv.vercelUrl && publicEnv.nodeEnv !== "production") {
    return `https://${publicEnv.vercelUrl}`;
  }
  const domain = getCanonicalAppDomain();
  const protocol = domain.includes("localhost") ? "http" : "https";
  return `${protocol}://${domain}`;
}

/**
 * Root domain that published sites get a subdomain under, e.g.
 * "paperchaiapp.com". Returns null when subdomain mode is disabled.
 */
export function getSiteRootDomain(): string | null {
  const raw = publicEnv.siteDomain;
  if (!raw) return null;
  return normalizeHost(raw) ?? APP_DOMAIN;
}

export function subdomainSitesEnabled(): boolean {
  return getSiteRootDomain() !== null;
}

// Subdomains that belong to the app itself — never treated as a site slug.
const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "api", "admin", "dashboard", "mail", "ftp",
  "blog", "staging", "dev", "preview", "cdn", "assets",
]);

/**
 * Extract a site slug from a request host given the root domain.
 * Returns null for the apex, www, reserved subdomains, or unrelated hosts
 * (e.g. Vercel preview URLs). Shared by proxy.ts and URL helpers.
 */
export function subdomainFromHost(host: string, root: string): string | null {
  const hostname = host.split(":")[0].toLowerCase().replace(/\.$/, "");

  // Local dev: <slug>.localhost
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.slice(0, -".localhost".length);
    return isUsableSub(sub) ? sub.split(".")[0] : null;
  }

  if (hostname === root || hostname === `www.${root}`) return null;
  if (!hostname.endsWith(`.${root}`)) return null;

  const sub = hostname.slice(0, -(root.length + 1));
  if (!isUsableSub(sub)) return null;
  // Only the left-most label is the slug (ignore nested labels).
  return sub.split(".")[0];
}

function isUsableSub(sub: string): boolean {
  if (!sub) return false;
  const first = sub.split(".")[0];
  if (!first) return false;
  return !RESERVED_SUBDOMAINS.has(first);
}

function isLocalDevHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function localDevSiteUrl(slug: string, host: string): string {
  const port = host.includes(":") ? host.split(":")[1] : "3000";
  return `http://${slug}.localhost:${port}`;
}

/** Path-only URL — works on the current host in the browser too. */
export function getPublicSitePath(slug: string): string {
  return `/${slug}`;
}

/** Href for navigation — full URL in subdomain mode, path on same origin otherwise. */
export function getPublicSiteHref(
  slug: string,
  opts?: { host?: string | null; customDomain?: string | null }
): string {
  if (opts?.customDomain) {
    return `https://www.${opts.customDomain.replace(/^www\./, "")}`;
  }
  if (subdomainSitesEnabled()) {
    return getPublicSiteUrl(slug, opts);
  }
  return getPublicSitePath(slug);
}

/** Canonical URL when a verified custom domain is connected. */
export function getPublicSiteUrl(
  slug: string,
  opts?: { host?: string | null; customDomain?: string | null }
): string {
  if (opts?.customDomain) {
    const domain = opts.customDomain.replace(/^www\./, "");
    return `https://www.${domain}`;
  }

  const root = getSiteRootDomain();
  const host = opts?.host?.toLowerCase() ?? "";
  const hostname = host.split(":")[0];

  if (root) {
    if (host && isLocalDevHost(hostname)) {
      return localDevSiteUrl(slug, host);
    }
    const protocol = root.includes("localhost") ? "http" : "https";
    return `${protocol}://${slug}.${root}`;
  }

  // Path mode — use the current host when we're already on the app.
  if (host && isLocalDevHost(hostname)) {
    const port = host.includes(":") ? `:${host.split(":")[1]}` : ":3000";
    return `http://${hostname}${port}${getPublicSitePath(slug)}`;
  }
  if (host && (hostname === getCanonicalAppDomain() || hostname === `www.${getCanonicalAppDomain()}`)) {
    return `https://${host}${getPublicSitePath(slug)}`;
  }

  return `${getAppBaseUrl()}${getPublicSitePath(slug)}`;
}
