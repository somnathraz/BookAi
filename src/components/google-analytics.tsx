"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { publicEnv } from "@/platform/config/public-env";

const measurementId = publicEnv.gaMeasurementId;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function pagePath(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * Sends page_view on App Router client navigations.
 * Initial hit comes from gtag('config') so we skip the first render.
 */
function GaPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstPath = useRef(true);

  useEffect(() => {
    if (!measurementId || typeof window.gtag !== "function") return;

    if (isFirstPath.current) {
      isFirstPath.current = false;
      return;
    }

    window.gtag("event", "page_view", {
      page_path: pagePath(pathname, searchParams),
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

/**
 * GA4 for PaperChai (paperchaiapp.com).
 * Loads afterInteractive so it does not block LCP; production only.
 */
export function GoogleAnalytics() {
  if (!measurementId || publicEnv.nodeEnv !== "production") {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}', {
  send_page_view: true,
  anonymize_ip: true
});
`}
      </Script>
      <Suspense fallback={null}>
        <GaPageViews />
      </Suspense>
    </>
  );
}
