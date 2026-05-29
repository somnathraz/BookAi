import "server-only";

import sharp from "sharp";

function toHex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Reject muddy greys / near-white / near-black — they make poor accents.
function isUsableAccent(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const sat = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
  return sat > 0.18 && l > 0.18 && l < 0.82;
}

async function fetchImage(url: string): Promise<Buffer | null> {
  if (!/^https?:\/\//i.test(url)) return null; // only absolute URLs server-side
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "Mozilla/5.0 (compatible; PaperChaiBot/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) return null;
    const ab = await res.arrayBuffer();
    if (ab.byteLength > 8_000_000) return null; // 8MB cap
    return Buffer.from(ab);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Returns dominant hex colors extracted from the given (absolute) image URLs.
// Best-effort: any fetch/decoding failure is skipped silently.
export async function extractPalette(urls: string[], max = 3): Promise<string[]> {
  const out: string[] = [];
  for (const url of urls.slice(0, max)) {
    try {
      const buf = await fetchImage(url);
      if (!buf) continue;
      const { dominant } = await sharp(buf).stats();
      if (isUsableAccent(dominant.r, dominant.g, dominant.b)) {
        out.push(rgbToHex(dominant.r, dominant.g, dominant.b));
      }
    } catch {
      /* skip */
    }
  }
  return [...new Set(out)];
}
