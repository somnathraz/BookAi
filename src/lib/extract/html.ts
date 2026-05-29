import "server-only";

// Lightweight HTML → readable text. Strips scripts/styles/markup and collapses
// whitespace. Good enough to feed an AI for positioning analysis.
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export interface SiteMeta {
  title?: string;
  description?: string;
  headings: string[];
  ogImage?: string;
  themeColor?: string;
  images: string[];
}

function metaContent(html: string, key: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${key}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${key}["']`,
    "i"
  );
  return html.match(re)?.[1]?.trim() || html.match(alt)?.[1]?.trim();
}

function toAbsolute(src: string, base?: string): string | null {
  try {
    return base ? new URL(src, base).toString() : new URL(src).toString();
  } catch {
    return null;
  }
}

export function extractMeta(html: string, baseUrl?: string): SiteMeta {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description =
    metaContent(html, "description") || metaContent(html, "og:description");
  const headings = [...html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 8);

  const ogRaw = metaContent(html, "og:image") || metaContent(html, "twitter:image");
  const ogImage = ogRaw ? toAbsolute(ogRaw, baseUrl) ?? undefined : undefined;
  const themeColor = metaContent(html, "theme-color");

  const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)]
    .map((m) => toAbsolute(m[1], baseUrl))
    .filter((u): u is string => Boolean(u))
    .filter((u) => /^https?:/i.test(u) && !u.endsWith(".svg"));
  const images = [...new Set([ogImage, ...imgs].filter((u): u is string => Boolean(u)))].slice(0, 8);

  return { title, description, headings, ogImage, themeColor, images };
}
