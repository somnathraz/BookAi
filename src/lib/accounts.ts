import "server-only";

import { randomUUID } from "crypto";

import { ensureSchema, getSql } from "@/lib/db";
import type { SiteData } from "@/lib/types";

// Accounts + generated sites. Postgres-backed when DATABASE_URL is set
// (durable, multi-instance, survives restarts); in-memory fallback otherwise.

export type Plan = "free" | "pro";

export const FREE_SITES_PER_IP = 2; // soft per-IP cap on the free plan

export function planLimit(plan: Plan): number {
  return plan === "pro" ? 1000 : 1; // free = 1 site; pro lifts it
}

export const FREE_SITE_LIMIT = planLimit("free");

export interface StoredSite {
  id: string;
  slug: string;
  name: string;
  domain: string;
  theme: string;
  accent?: string;
  createdAt: number;
  site: SiteData;
}

// Slugs become the public path (/<slug>), so they must avoid the app's own
// routes and be URL-clean + unique.
const RESERVED_SLUGS = new Set([
  "api", "pricing", "about", "dashboard", "_next", "favicon.ico", "site", "admin",
  "login", "signup", "settings", "new", "create",
]);

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "site";
}

function shortId(): string {
  return Math.random().toString(36).slice(2, 6);
}

/** Postgres jsonb must store an object — not JSON.stringify (that saves a string). */
function parseSiteData(raw: unknown): SiteData {
  if (typeof raw === "string") {
    try {
      const once = JSON.parse(raw) as unknown;
      if (typeof once === "string") return JSON.parse(once) as SiteData;
      return once as SiteData;
    } catch {
      /* fall through */
    }
  }
  return raw as SiteData;
}

// ── in-memory fallback ────────────────────────────────────────────────────────
interface MemAccount {
  email: string;
  plan: Plan;
  ips: string[];
  sites: StoredSite[];
}
const mem = new Map<string, MemAccount>();
const memSitesByIp = new Map<string, number>();

function key(email: string): string {
  return email.trim().toLowerCase();
}
function memAcc(email: string): MemAccount {
  const k = key(email);
  let a = mem.get(k);
  if (!a) {
    a = { email: k, plan: "free", ips: [], sites: [] };
    mem.set(k, a);
  }
  return a;
}

// ──────────────────────────────────────────────────────────────────────────────

async function slugTaken(slug: string): Promise<boolean> {
  if (RESERVED_SLUGS.has(slug)) return true;
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const r = await sql`select 1 from sites where slug = ${slug} limit 1`;
    return r.length > 0;
  }
  for (const a of mem.values()) {
    if (a.sites.some((s) => s.slug === slug)) return true;
  }
  return false;
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  if (!(await slugTaken(base))) return base;
  for (let i = 0; i < 6; i++) {
    const candidate = `${base}-${shortId()}`;
    if (!(await slugTaken(candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

// Public lookup for the /[slug] route — no auth, any visitor.
export async function getSiteBySlug(slug: string): Promise<StoredSite | null> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<
      {
        id: string;
        slug: string;
        name: string;
        domain: string;
        theme: string;
        accent: string | null;
        created_at: Date;
        data: SiteData;
      }[]
    >`select id, slug, name, domain, theme, accent, created_at, data
        from sites where slug = ${slug} limit 1`;
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      domain: r.domain,
      theme: r.theme,
      accent: r.accent ?? undefined,
      createdAt: new Date(r.created_at).getTime(),
      site: parseSiteData(r.data),
    };
  }
  for (const a of mem.values()) {
    const s = a.sites.find((x) => x.slug === slug);
    if (s) return s;
  }
  return null;
}

export async function getPlan(email: string): Promise<Plan> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<{ plan: Plan }[]>`select plan from accounts where email = ${key(email)}`;
    return rows[0]?.plan ?? "free";
  }
  return memAcc(email).plan;
}

export async function setPlan(email: string, plan: Plan): Promise<void> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    await sql`
      insert into accounts (email, plan) values (${key(email)}, ${plan})
      on conflict (email) do update set plan = ${plan}`;
    return;
  }
  memAcc(email).plan = plan;
}

export async function siteCount(email: string): Promise<number> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<{ n: string }[]>`select count(*)::int as n from sites where email = ${key(email)}`;
    return Number(rows[0]?.n ?? 0);
  }
  return memAcc(email).sites.length;
}

export async function ipSiteCount(ip?: string): Promise<number> {
  if (!ip) return 0;
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<{ n: string }[]>`select count(*)::int as n from sites where ip = ${ip}`;
    return Number(rows[0]?.n ?? 0);
  }
  return memSitesByIp.get(ip) ?? 0;
}

export async function canGenerate(
  email: string,
  ip?: string
): Promise<{ ok: boolean; reason?: string }> {
  const plan = await getPlan(email);
  const limit = planLimit(plan);
  if ((await siteCount(email)) >= limit) {
    return {
      ok: false,
      reason:
        plan === "pro"
          ? "You've reached your plan's site limit."
          : `Your free plan includes ${limit} site. Upgrade to Pro for more.`,
    };
  }
  if (plan === "free" && ip && (await ipSiteCount(ip)) >= FREE_SITES_PER_IP) {
    return {
      ok: false,
      reason: "You've reached the free limit for this network. Upgrade to Pro for more.",
    };
  }
  return { ok: true };
}

export async function addSite(
  email: string,
  ip: string | undefined,
  site: SiteData
): Promise<StoredSite> {
  const slug = await uniqueSlug(site.identity.name);
  const stored: StoredSite = {
    id: randomUUID(),
    slug,
    name: site.identity.name,
    domain: site.identity.domain,
    theme: site.theme,
    accent: site.accent,
    createdAt: Date.now(),
    site,
  };
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    await sql`insert into accounts (email) values (${key(email)}) on conflict (email) do nothing`;
    await sql`
      insert into sites (id, email, slug, name, domain, theme, accent, ip, data, created_at)
      values (${stored.id}, ${key(email)}, ${slug}, ${stored.name}, ${stored.domain},
              ${stored.theme}, ${stored.accent ?? null}, ${ip ?? null},
              ${sql.json(JSON.parse(JSON.stringify(site)))}, to_timestamp(${stored.createdAt} / 1000.0))`;
    return stored;
  }
  const a = memAcc(email);
  if (ip && !a.ips.includes(ip)) a.ips.push(ip);
  a.sites.push(stored);
  if (ip) memSitesByIp.set(ip, (memSitesByIp.get(ip) ?? 0) + 1);
  return stored;
}

export async function listSites(email: string): Promise<StoredSite[]> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<
      {
        id: string;
        slug: string;
        name: string;
        domain: string;
        theme: string;
        accent: string | null;
        created_at: Date;
        data: SiteData;
      }[]
    >`select id, slug, name, domain, theme, accent, created_at, data
        from sites where email = ${key(email)} order by created_at desc`;
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      domain: r.domain,
      theme: r.theme,
      accent: r.accent ?? undefined,
      createdAt: new Date(r.created_at).getTime(),
      site: parseSiteData(r.data),
    }));
  }
  return [...memAcc(email).sites].sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteSite(email: string, id: string): Promise<boolean> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const res = await sql`delete from sites where email = ${key(email)} and id = ${id}`;
    return res.count > 0;
  }
  const a = mem.get(key(email));
  if (!a) return false;
  const i = a.sites.findIndex((s) => s.id === id);
  if (i === -1) return false;
  a.sites.splice(i, 1);
  return true;
}
