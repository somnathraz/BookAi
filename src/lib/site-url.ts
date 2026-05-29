// Public URLs for published sites (Phase 1: path-based, no wildcard DNS).
//   paperchaiapp.com/glamzone  →  getPublicSiteUrl("glamzone")
// Phase 2 (Vercel Pro): glamzone.paperchaiapp.com — swap the helper then.

/** App origin for absolute links (emails, OG tags, copy-to-clipboard). */
export function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Path-only URL — works on the current host in the browser too. */
export function getPublicSitePath(slug: string): string {
  return `/${slug}`;
}

export function getPublicSiteUrl(slug: string): string {
  return `${getAppBaseUrl()}${getPublicSitePath(slug)}`;
}
