#!/usr/bin/env node
// Submit every URL in one or more sitemaps (plus extra URLs) to IndexNow.
//
//   node scripts/indexnow-submit.mjs https://builder.kritvani.com/sitemap.xml https://kritvani.com/
//
// Arguments ending in .xml are read as sitemaps; anything else is submitted as
// a page URL. Only hosts served by this app carry the key file, so URLs on
// other hosts (paperchai., chairside.) are rejected by the engines.

const KEY = "e2533076a3fc974bf825a3899cfe35eb";
const ENDPOINT = "https://api.indexnow.org/indexnow";

async function sitemapUrls(url) {
  const xml = await (await fetch(url)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/indexnow-submit.mjs <sitemap.xml | url> ...");
  process.exit(1);
}

const urls = [];
for (const arg of args) {
  if (arg.endsWith(".xml")) urls.push(...(await sitemapUrls(arg)));
  else urls.push(arg);
}

const byHost = new Map();
for (const u of new Set(urls)) {
  const host = new URL(u).host;
  byHost.set(host, [...(byHost.get(host) ?? []), u]);
}

for (const [host, urlList] of byHost) {
  // The protocol allows up to 10,000 URLs per request.
  for (let i = 0; i < urlList.length; i += 10_000) {
    const batch = urlList.slice(i, i + 10_000);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: KEY, keyLocation: `https://${host}/${KEY}.txt`, urlList: batch }),
    });
    console.log(`${host}: ${batch.length} URLs → HTTP ${res.status}`);
  }
}
