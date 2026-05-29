import "server-only";

import { extractMeta, htmlToText } from "@/lib/extract/html";
import { extractPalette } from "@/lib/extract/palette";
import { analyzeCore, buildAnalysis } from "@/lib/extract/shared";
import type { AnalysisResult } from "@/lib/types";

async function fetchHtml(rawUrl: string): Promise<{ html: string; url: string }> {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; BookAiBot/1.0; +https://bookai.app)",
        accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`Site returned ${res.status}.`);
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("html")) throw new Error("That URL didn't return a web page.");
    return { html: await res.text(), url: res.url || url };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("That site took too long to respond.");
    }
    throw err instanceof Error ? err : new Error("Could not fetch that site.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractFromUrl(rawUrl: string): Promise<AnalysisResult> {
  const { html, url } = await fetchHtml(rawUrl);
  const meta = extractMeta(html, url);
  const text = htmlToText(html);

  const context = `The source material is text scraped from an existing business / competitor website (title: "${meta.title ?? ""}"). Analyze its domain, services, and positioning, then produce a STARTING profile for a NEW business in the same space. Do NOT copy their name, exact wording, or testimonials — use a generic placeholder name like "Your Business" and write original service descriptions inspired by the category. Leave testimonials empty.`;

  const [core, imgPalette] = await Promise.all([
    analyzeCore(
      `${meta.title ?? ""}\n${meta.description ?? ""}\n${meta.headings.join(" · ")}\n\n${text}`,
      context
    ),
    extractPalette(meta.images),
  ]);

  const palette = [...new Set([meta.themeColor, ...imgPalette].filter(Boolean) as string[])];

  return buildAnalysis("competitor", core, { images: meta.images, palette });
}
