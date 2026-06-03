import "server-only";

const BASE = "https://serpapi.com/search.json";

export function serpApiAvailable(): boolean {
  return Boolean(process.env.SERP_API_KEY?.trim());
}

function apiKey(): string {
  const key = process.env.SERP_API_KEY?.trim();
  if (!key) throw new Error("SERP_API_KEY is not configured.");
  return key;
}

export async function serpSearch(
  params: Record<string, string | number | undefined>
): Promise<Record<string, unknown>> {
  const sp = new URLSearchParams({ api_key: apiKey(), hl: "en" });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const res = await fetch(`${BASE}?${sp}`, { next: { revalidate: 0 } });
  const data = (await res.json()) as Record<string, unknown> & { error?: string };
  if (!res.ok || data.error) {
    throw new Error(
      typeof data.error === "string" ? data.error : `SerpAPI error ${res.status}`
    );
  }
  return data;
}
