import "server-only";

/** Hosts we allow through /api/img (Google Maps / Business photos). */
const ALLOWED_HOST_SUFFIXES = [
  "googleusercontent.com",
  "ggpht.com",
  "gstatic.com",
  "google.com",
  "serpapi.com",
];

export function isProxiableImageUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ALLOWED_HOST_SUFFIXES.some(
      (s) => host === s || host.endsWith(`.${s}`)
    );
  } catch {
    return false;
  }
}

/** Same-origin proxy so Google photo URLs load in the browser. */
export function proxyGalleryUrl(url: string): string {
  if (!url || url.startsWith("/")) return url;
  if (!isProxiableImageUrl(url)) return url;
  return `/api/img?url=${encodeURIComponent(url)}`;
}

export function proxyGalleryUrls(urls: string[]): string[] {
  return urls.map(proxyGalleryUrl);
}
