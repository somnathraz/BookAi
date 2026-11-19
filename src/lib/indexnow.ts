import "server-only";

import { logger } from "@/platform/logging/logger.server";

// IndexNow (https://www.indexnow.org) tells Bing, Yandex, Naver, Seznam and
// other participating engines about new or changed URLs immediately instead of
// waiting for a crawl. The key is public by design: engines confirm ownership
// by fetching https://<host>/<key>.txt, which public/ serves on every host
// (builder, brand apex and each <slug>.sites.kritvani.com).
export const INDEXNOW_KEY = "e2533076a3fc974bf825a3899cfe35eb";

const ENDPOINT = "https://api.indexnow.org/indexnow";

/** Submit absolute URLs; grouped per host as the protocol requires. Never throws. */
export async function submitToIndexNow(urls: string[]): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;

  const byHost = new Map<string, string[]>();
  for (const raw of urls) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "https:") continue;
      byHost.set(u.host, [...(byHost.get(u.host) ?? []), u.toString()]);
    } catch {
      /* skip malformed */
    }
  }

  await Promise.all(
    [...byHost].map(async ([host, urlList]) => {
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            host,
            key: INDEXNOW_KEY,
            keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
            urlList,
          }),
          signal: AbortSignal.timeout(8_000),
        });
        // 200 = accepted, 202 = accepted pending key check.
        if (res.status !== 200 && res.status !== 202) {
          logger.warn("indexnow.submit.failed", { host, status: res.status });
        }
      } catch (error) {
        logger.warn("indexnow.submit.error", { host, error: String(error) });
      }
    })
  );
}
