// Public URLs for published sites.
//
//   Path mode (default):       paperchaiapp.com/glamzone
//   Subdomain mode (wildcard): glamzone.paperchaiapp.com
//
// Subdomain mode turns on automatically when NEXT_PUBLIC_SITE_DOMAIN is set
// (e.g. "paperchaiapp.com"). proxy.ts then rewrites <slug>.<domain> to
// the /[slug] route, so both URL styles keep working.

/** App origin for absolute links (emails, OG tags, copy-to-clipboard). */
export function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Root domain that published sites get a subdomain under, e.g.
 * "paperchaiapp.com". Returns null when subdomain mode is disabled.
 */
export function getSiteRootDomain(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_DOMAIN?.trim();
  if (!raw) return null;
  return raw
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .toLowerCase();
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

/** Path-only URL — works on the current host in the browser too. */
export function getPublicSitePath(slug: string): string {
  return `/${slug}`;
}

export function getPublicSiteUrl(slug: string): string {
  const root = getSiteRootDomain();
  if (root) {
    const protocol = root.includes("localhost") ? "http" : "https";
    return `${protocol}://${slug}.${root}`;
  }
  return `${getAppBaseUrl()}${getPublicSitePath(slug)}`;
}
