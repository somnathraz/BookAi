/** Shared copy + helpers for finding a Google Business via Maps Share link. */

export type MapsFindStep = { title: string; detail: string };

export const MAPS_FIND_MOBILE_STEPS: MapsFindStep[] = [
  {
    title: "Open the Google Maps app",
    detail:
      "Tap Open Google Maps below — on phones it opens the Maps app when installed. Search your business name and city, then tap your listing.",
  },
  {
    title: "Tap Share on your business",
    detail:
      "On the business card, scroll the bottom sheet and tap Share (the arrow icon).",
  },
  {
    title: "Tap Copy link",
    detail:
      "Choose Copy link. You should get a short maps.app.goo.gl/… link on your clipboard.",
  },
  {
    title: "Come back and paste it",
    detail:
      "Return to PaperChai and paste that Share link so we import the right location.",
  },
];

export const MAPS_FIND_DESKTOP_STEPS: MapsFindStep[] = [
  {
    title: "Open Google Maps in your browser",
    detail:
      "Use the button below, search your business name and city, then click your listing.",
  },
  {
    title: "Click Share",
    detail:
      "On the left panel of the business, click the Share icon (arrow).",
  },
  {
    title: "Click Copy link",
    detail:
      "Copy the short maps.app.goo.gl/… link — that is the one that works best.",
  },
  {
    title: "Paste it back here",
    detail:
      "Return to PaperChai and paste the link to create your site.",
  },
];

export function mapsSearchWebUrl(query: string): string {
  const params = new URLSearchParams({
    api: "1",
    query: query.trim() || "business near me",
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function isLikelyMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/**
 * Opens Google Maps for a search query.
 * On phones, prefers the native Maps app and falls back to the web Maps URL.
 */
export function openGoogleMapsSearch(query: string): void {
  if (typeof window === "undefined") return;

  const q = query.trim() || "business near me";
  const web = mapsSearchWebUrl(q);
  const ua = navigator.userAgent;
  const encoded = encodeURIComponent(q);

  if (/iPhone|iPad|iPod/i.test(ua)) {
    const started = Date.now();
    window.location.href = `comgooglemaps://?q=${encoded}`;
    window.setTimeout(() => {
      if (
        Date.now() - started < 1800 &&
        document.visibilityState === "visible"
      ) {
        window.location.href = web;
      }
    }, 900);
    return;
  }

  if (/Android/i.test(ua)) {
    window.location.href =
      `intent://maps.google.com/maps?q=${encoded}` +
      `#Intent;scheme=https;package=com.google.android.apps.maps;` +
      `S.browser_fallback_url=${encodeURIComponent(web)};end`;
    return;
  }

  window.open(web, "_blank", "noopener,noreferrer");
}
