import { NextResponse, type NextRequest } from "next/server";

import { getSiteSlugByVerifiedHost } from "@/lib/custom-domain";
import { getSiteRootDomain, subdomainFromHost } from "@/lib/site-url";

// Wildcard subdomain routing: glamzone.paperchaiapp.com → /glamzone
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

  let slug: string | null = null;
  if (root) {
    slug = subdomainFromHost(host, root);
  }
  if (!slug) {
    slug = await getSiteSlugByVerifiedHost(host);
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
