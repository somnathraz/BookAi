import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { getCanonicalAppDomain } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Public image proxies used by generated sites must remain crawlable.
        // The longer allow rules take precedence over the /api/ disallow.
        allow: ["/", "/api/img", "/api/photo"],
        disallow: [
          // Owner-only / private app surfaces
          "/dashboard",
          "/edit",
          "/preview",
          // Non-public APIs. Do not block /_next/: crawlers need CSS and JS.
          "/api/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getCanonicalAppDomain(),
  };
}
