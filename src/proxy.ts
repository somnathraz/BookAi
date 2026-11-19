import { NextResponse, type NextRequest } from "next/server";

import { BRAND_DOMAIN, LEGACY_APP_DOMAINS } from "@/lib/brand";
import { getSiteSlugByVerifiedHost } from "@/lib/custom-domain";
import {
  getCanonicalAppDomain,
  getSiteRootDomain,
  subdomainFromHost,
} from "@/lib/site-url";

/**
 * Where a legacy-domain request should go, or null if the host isn't legacy.
 *   paperchaiapp.com/x, www.paperchaiapp.com/x → https://builder.kritvani.com/x
 *   glamzone.paperchaiapp.com/x                → https://glamzone.sites.kritvani.com/x
 */
function legacyRedirectTarget(
  hostname: string,
  appDomain: string,
  siteRoot: string | null
): { host: string; slugPrefix: string | null } | null {
  for (const legacy of LEGACY_APP_DOMAINS) {
    if (hostname === legacy || hostname === `www.${legacy}`) {
      return { host: appDomain, slugPrefix: null };
    }
    if (hostname.endsWith(`.${legacy}`)) {
      const sub = subdomainFromHost(hostname, legacy);
      if (!sub) return { host: appDomain, slugPrefix: null };
      return siteRoot
        ? { host: `${sub}.${siteRoot}`, slugPrefix: null }
        : { host: appDomain, slugPrefix: sub };
    }
  }
  return null;
}

// Wildcard subdomain routing: glamzone.sites.kritvani.com → /glamzone
// Custom domains: www.example.com → /glamzone (after DNS + verification)
//
// When NEXT_PUBLIC_SITE_DOMAIN is set, a request to a site subdomain is
// rewritten (not redirected) onto the existing /[slug] route. Verified custom
// domains are resolved the same way. The apex app domain and www pass through.

function withPlatformHeaders(response: NextResponse, requestId: string): NextResponse {
  response.headers.set("x-request-id", requestId);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  return response;
}

export async function proxy(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  // API policy enforcement itself happens in the Node route factory, but every
  // API request receives the same correlation ID and baseline headers here.
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return withPlatformHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      requestId
    );
  }

  const root = getSiteRootDomain();
  const host = req.headers.get("host");
  if (!host) {
    return withPlatformHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      requestId
    );
  }

  const hostname = host.split(":")[0].toLowerCase().replace(/\.$/, "");
  const appDomain = getCanonicalAppDomain();

  // Old paperchaiapp.com URLs → permanent redirect to the Kritvani equivalent.
  const legacy = legacyRedirectTarget(hostname, appDomain, root);
  if (legacy) {
    const target = req.nextUrl.clone();
    target.protocol = "https:";
    target.hostname = legacy.host;
    target.port = "";
    if (legacy.slugPrefix) {
      target.pathname = `/${legacy.slugPrefix}${target.pathname === "/" ? "" : target.pathname}`;
    }
    return withPlatformHeaders(NextResponse.redirect(target, 308), requestId);
  }

  // The company apex (kritvani.com) will get its own site in a separate repo.
  // Until that project takes over the domain, send it to the builder with a
  // temporary redirect so it never serves a duplicate of the builder.
  if (hostname === BRAND_DOMAIN || hostname === `www.${BRAND_DOMAIN}`) {
    const target = req.nextUrl.clone();
    target.protocol = "https:";
    target.port = "";
    target.hostname = appDomain;
    return withPlatformHeaders(NextResponse.redirect(target, 307), requestId);
  }

  // www.<apex> would otherwise serve a full duplicate of the apex site, which
  // Search Console reports as "Alternate page with proper canonical tag".
  if (hostname === `www.${appDomain}`) {
    const canonical = req.nextUrl.clone();
    canonical.hostname = appDomain;
    canonical.port = "";
    return withPlatformHeaders(NextResponse.redirect(canonical, 308), requestId);
  }

  let slug: string | null = null;
  if (root) {
    slug = subdomainFromHost(host, root);
  }
  // The apex never maps to a customer site, so marketing pages must not depend
  // on the database. A failed lookup also falls through to the app instead of
  // turning every request into a 500.
  const isAppHost = hostname === appDomain || hostname === root;
  if (!slug && !isAppHost) {
    try {
      slug = await getSiteSlugByVerifiedHost(host);
    } catch {
      slug = null;
    }
  }
  if (!slug) {
    return withPlatformHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      requestId
    );
  }

  const url = req.nextUrl.clone();

  if (url.pathname === `/${slug}` || url.pathname.startsWith(`/${slug}/`)) {
    return withPlatformHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      requestId
    );
  }

  const suffix = url.pathname === "/" ? "" : url.pathname;
  url.pathname = `/${slug}${suffix}`;
  return withPlatformHeaders(NextResponse.rewrite(url), requestId);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/robots.txt",
    "/sitemap.xml",
    "/((?!api/|_next/|.*\\..*).*)",
  ],
};
