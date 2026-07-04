import "server-only";

import { randomUUID } from "crypto";

import { ensureSchema, getSql } from "@/lib/db";
import type { BillingPeriod, BillingStatus } from "@/lib/razorpay";
import type { SiteData } from "@/lib/types";

// Accounts + generated sites. Postgres-backed when DATABASE_URL is set
// (durable, multi-instance, survives restarts); in-memory fallback otherwise.

export type Plan = "free" | "basic";

export const FREE_SITES_PER_IP = 2; // soft per-IP cap on the free plan

export function normalizePlan(raw: string | undefined | null): Plan {
  if (raw === "basic" || raw === "pro") return "basic";
  return "free";
}

export function planLimit(plan: Plan): number {
  if (plan === "basic") return 5;
  return 1;
}

export const FREE_SITE_LIMIT = planLimit("free");

export interface AccountBilling {
  plan: Plan;
  subscriptionId?: string;
  billingPeriod?: BillingPeriod;
  billingStatus?: BillingStatus;
  billingUpdatedAt?: number;
  billingStartedAt?: number;
  billingCurrentStart?: number;
  billingCurrentEnd?: number;
  billingChargeAt?: number;
  billingCancelAtCycleEnd?: boolean;
  billingCancelledAt?: number;
  billingLastReminderAt?: number;
}

export interface StoredSite {
  id: string;
  slug: string;
  name: string;
  domain: string;
  theme: string;
  accent?: string;
  customDomain?: string;
  customDomainVerified?: boolean;
  customDomainVerifyToken?: string;
  createdAt: number;
  updatedAt: number;
  site: SiteData;
}

// Slugs become the public path (/<slug>), so they must avoid the app's own
// routes and be URL-clean + unique.
const RESERVED_SLUGS = new Set([
  "api", "pricing", "about", "dashboard", "edit", "_next", "favicon.ico", "site", "admin",
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

type SiteRow = {
  id: string;
  slug: string;
  name: string;
  domain: string;
  theme: string;
  accent: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean | null;
  custom_domain_verify_token: string | null;
  created_at: Date;
  updated_at: Date | null;
  data: SiteData;
};

function rowToStoredSite(r: SiteRow): StoredSite {
  const createdAt = new Date(r.created_at).getTime();
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    domain: r.domain,
    theme: r.theme,
    accent: r.accent ?? undefined,
    customDomain: r.custom_domain ?? undefined,
    customDomainVerified: r.custom_domain_verified ?? false,
    customDomainVerifyToken: r.custom_domain_verify_token ?? undefined,
    createdAt,
    updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : createdAt,
    site: parseSiteData(r.data),
  };
}

type AccountRow = {
  plan: string;
  razorpay_subscription_id: string | null;
  billing_period: string | null;
  billing_status: string | null;
  billing_updated_at: Date | null;
  billing_started_at: Date | null;
  billing_current_start: Date | null;
  billing_current_end: Date | null;
  billing_charge_at: Date | null;
  billing_cancel_at_cycle_end: boolean | null;
  billing_cancelled_at: Date | null;
  billing_last_reminder_at: Date | null;
};

function normalizeBillingPeriod(raw: string | null | undefined): BillingPeriod | undefined {
  return raw === "monthly" || raw === "annual" ? raw : undefined;
}

function normalizeBillingStatus(raw: string | null | undefined): BillingStatus | undefined {
  return raw === "created" ||
    raw === "authenticated" ||
    raw === "active" ||
    raw === "cancelled" ||
    raw === "halted" ||
    raw === "failed"
    ? raw
    : undefined;
}

function rowToAccountBilling(row: AccountRow | undefined): AccountBilling {
  return {
    plan: normalizePlan(row?.plan),
    subscriptionId: row?.razorpay_subscription_id ?? undefined,
    billingPeriod: normalizeBillingPeriod(row?.billing_period),
    billingStatus: normalizeBillingStatus(row?.billing_status),
    billingUpdatedAt: row?.billing_updated_at
      ? new Date(row.billing_updated_at).getTime()
      : undefined,
    billingStartedAt: row?.billing_started_at
      ? new Date(row.billing_started_at).getTime()
      : undefined,
    billingCurrentStart: row?.billing_current_start
      ? new Date(row.billing_current_start).getTime()
      : undefined,
    billingCurrentEnd: row?.billing_current_end
      ? new Date(row.billing_current_end).getTime()
      : undefined,
    billingChargeAt: row?.billing_charge_at
      ? new Date(row.billing_charge_at).getTime()
      : undefined,
    billingCancelAtCycleEnd: row?.billing_cancel_at_cycle_end ?? false,
    billingCancelledAt: row?.billing_cancelled_at
      ? new Date(row.billing_cancelled_at).getTime()
      : undefined,
    billingLastReminderAt: row?.billing_last_reminder_at
      ? new Date(row.billing_last_reminder_at).getTime()
      : undefined,
  };
}

// ── in-memory fallback ────────────────────────────────────────────────────────
interface MemAccount {
  email: string;
  plan: Plan;
  subscriptionId?: string;
  billingPeriod?: BillingPeriod;
  billingStatus?: BillingStatus;
  billingUpdatedAt?: number;
  billingStartedAt?: number;
  billingCurrentStart?: number;
  billingCurrentEnd?: number;
  billingChargeAt?: number;
  billingCancelAtCycleEnd?: boolean;
  billingCancelledAt?: number;
  billingLastReminderAt?: number;
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
    const rows = await sql<SiteRow[]>`
      select id, slug, name, domain, theme, accent,
             custom_domain, custom_domain_verified, custom_domain_verify_token,
             created_at, updated_at, data
        from sites where slug = ${slug} limit 1`;
    const r = rows[0];
    if (!r) return null;
    return rowToStoredSite(r);
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
    const rows = await sql<{ plan: string }[]>`select plan from accounts where email = ${key(email)}`;
    return normalizePlan(rows[0]?.plan);
  }
  return memAcc(email).plan;
}

export async function getAccountBilling(email: string): Promise<AccountBilling> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<AccountRow[]>`
      select plan, razorpay_subscription_id, billing_period, billing_status, billing_updated_at,
             billing_started_at, billing_current_start, billing_current_end, billing_charge_at,
             billing_cancel_at_cycle_end, billing_cancelled_at, billing_last_reminder_at
        from accounts where email = ${key(email)} limit 1`;
    return rowToAccountBilling(rows[0]);
  }
  const a = memAcc(email);
  return {
    plan: a.plan,
    subscriptionId: a.subscriptionId,
    billingPeriod: a.billingPeriod,
    billingStatus: a.billingStatus,
    billingUpdatedAt: a.billingUpdatedAt,
    billingStartedAt: a.billingStartedAt,
    billingCurrentStart: a.billingCurrentStart,
    billingCurrentEnd: a.billingCurrentEnd,
    billingChargeAt: a.billingChargeAt,
    billingCancelAtCycleEnd: a.billingCancelAtCycleEnd ?? false,
    billingCancelledAt: a.billingCancelledAt,
    billingLastReminderAt: a.billingLastReminderAt,
  };
}

export async function setAccountBilling(
  email: string,
  patch: {
    plan?: Plan;
    subscriptionId?: string | null;
    billingPeriod?: BillingPeriod | null;
    billingStatus?: BillingStatus | null;
    billingUpdatedAt?: number;
    billingStartedAt?: number | null;
    billingCurrentStart?: number | null;
    billingCurrentEnd?: number | null;
    billingChargeAt?: number | null;
    billingCancelAtCycleEnd?: boolean;
    billingCancelledAt?: number | null;
    billingLastReminderAt?: number | null;
  }
): Promise<AccountBilling> {
  const current = await getAccountBilling(email);
  const next: AccountBilling = {
    plan: patch.plan ?? current.plan,
    subscriptionId:
      patch.subscriptionId !== undefined ? patch.subscriptionId ?? undefined : current.subscriptionId,
    billingPeriod:
      patch.billingPeriod !== undefined ? patch.billingPeriod ?? undefined : current.billingPeriod,
    billingStatus:
      patch.billingStatus !== undefined ? patch.billingStatus ?? undefined : current.billingStatus,
    billingUpdatedAt: patch.billingUpdatedAt ?? Date.now(),
    billingStartedAt:
      patch.billingStartedAt !== undefined ? patch.billingStartedAt ?? undefined : current.billingStartedAt,
    billingCurrentStart:
      patch.billingCurrentStart !== undefined
        ? patch.billingCurrentStart ?? undefined
        : current.billingCurrentStart,
    billingCurrentEnd:
      patch.billingCurrentEnd !== undefined
        ? patch.billingCurrentEnd ?? undefined
        : current.billingCurrentEnd,
    billingChargeAt:
      patch.billingChargeAt !== undefined ? patch.billingChargeAt ?? undefined : current.billingChargeAt,
    billingCancelAtCycleEnd:
      patch.billingCancelAtCycleEnd !== undefined
        ? patch.billingCancelAtCycleEnd
        : current.billingCancelAtCycleEnd ?? false,
    billingCancelledAt:
      patch.billingCancelledAt !== undefined
        ? patch.billingCancelledAt ?? undefined
        : current.billingCancelledAt,
    billingLastReminderAt:
      patch.billingLastReminderAt !== undefined
        ? patch.billingLastReminderAt ?? undefined
        : current.billingLastReminderAt,
  };
  const billingUpdatedAt = next.billingUpdatedAt ?? Date.now();

  const sql = getSql();
  if (sql) {
    await ensureSchema();
    await sql`
      insert into accounts (
        email, plan, razorpay_subscription_id, billing_period, billing_status, billing_updated_at,
        billing_started_at, billing_current_start, billing_current_end, billing_charge_at,
        billing_cancel_at_cycle_end, billing_cancelled_at, billing_last_reminder_at
      ) values (
        ${key(email)}, ${next.plan}, ${next.subscriptionId ?? null}, ${next.billingPeriod ?? null},
        ${next.billingStatus ?? null}, to_timestamp(${billingUpdatedAt} / 1000.0),
        ${next.billingStartedAt ? sql`to_timestamp(${next.billingStartedAt} / 1000.0)` : null},
        ${next.billingCurrentStart ? sql`to_timestamp(${next.billingCurrentStart} / 1000.0)` : null},
        ${next.billingCurrentEnd ? sql`to_timestamp(${next.billingCurrentEnd} / 1000.0)` : null},
        ${next.billingChargeAt ? sql`to_timestamp(${next.billingChargeAt} / 1000.0)` : null},
        ${next.billingCancelAtCycleEnd ?? false},
        ${next.billingCancelledAt ? sql`to_timestamp(${next.billingCancelledAt} / 1000.0)` : null},
        ${next.billingLastReminderAt ? sql`to_timestamp(${next.billingLastReminderAt} / 1000.0)` : null}
      )
      on conflict (email) do update set
        plan = ${next.plan},
        razorpay_subscription_id = ${next.subscriptionId ?? null},
        billing_period = ${next.billingPeriod ?? null},
        billing_status = ${next.billingStatus ?? null},
        billing_updated_at = to_timestamp(${billingUpdatedAt} / 1000.0),
        billing_started_at = ${next.billingStartedAt ? sql`to_timestamp(${next.billingStartedAt} / 1000.0)` : null},
        billing_current_start = ${next.billingCurrentStart ? sql`to_timestamp(${next.billingCurrentStart} / 1000.0)` : null},
        billing_current_end = ${next.billingCurrentEnd ? sql`to_timestamp(${next.billingCurrentEnd} / 1000.0)` : null},
        billing_charge_at = ${next.billingChargeAt ? sql`to_timestamp(${next.billingChargeAt} / 1000.0)` : null},
        billing_cancel_at_cycle_end = ${next.billingCancelAtCycleEnd ?? false},
        billing_cancelled_at = ${next.billingCancelledAt ? sql`to_timestamp(${next.billingCancelledAt} / 1000.0)` : null},
        billing_last_reminder_at = ${next.billingLastReminderAt ? sql`to_timestamp(${next.billingLastReminderAt} / 1000.0)` : null}`;
    return next;
  }

  const a = memAcc(email);
  a.plan = next.plan;
  a.subscriptionId = next.subscriptionId;
  a.billingPeriod = next.billingPeriod;
  a.billingStatus = next.billingStatus;
  a.billingUpdatedAt = billingUpdatedAt;
  a.billingStartedAt = next.billingStartedAt;
  a.billingCurrentStart = next.billingCurrentStart;
  a.billingCurrentEnd = next.billingCurrentEnd;
  a.billingChargeAt = next.billingChargeAt;
  a.billingCancelAtCycleEnd = next.billingCancelAtCycleEnd;
  a.billingCancelledAt = next.billingCancelledAt;
  a.billingLastReminderAt = next.billingLastReminderAt;
  return next;
}

export async function findEmailBySubscriptionId(
  subscriptionId: string
): Promise<string | null> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<{ email: string }[]>`
      select email from accounts
       where razorpay_subscription_id = ${subscriptionId}
       limit 1`;
    return rows[0]?.email ?? null;
  }
  for (const [email, account] of mem.entries()) {
    if (account.subscriptionId === subscriptionId) return email;
  }
  return null;
}

export async function markBillingReminderSent(
  email: string,
  when: number = Date.now()
): Promise<AccountBilling> {
  return setAccountBilling(email, { billingLastReminderAt: when });
}

export async function listAccountBilling(): Promise<
  { email: string; billing: AccountBilling }[]
> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<(AccountRow & { email: string })[]>`
      select email, plan, razorpay_subscription_id, billing_period, billing_status, billing_updated_at,
             billing_started_at, billing_current_start, billing_current_end, billing_charge_at,
             billing_cancel_at_cycle_end, billing_cancelled_at, billing_last_reminder_at
        from accounts`;
    return rows.map((row) => ({
      email: row.email,
      billing: rowToAccountBilling(row),
    }));
  }
  return [...mem.entries()].map(([email, account]) => ({
    email,
    billing: {
      plan: account.plan,
      subscriptionId: account.subscriptionId,
      billingPeriod: account.billingPeriod,
      billingStatus: account.billingStatus,
      billingUpdatedAt: account.billingUpdatedAt,
      billingStartedAt: account.billingStartedAt,
      billingCurrentStart: account.billingCurrentStart,
      billingCurrentEnd: account.billingCurrentEnd,
      billingChargeAt: account.billingChargeAt,
      billingCancelAtCycleEnd: account.billingCancelAtCycleEnd ?? false,
      billingCancelledAt: account.billingCancelledAt,
      billingLastReminderAt: account.billingLastReminderAt,
    },
  }));
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
        plan === "basic"
          ? "You've reached your plan's site limit."
          : `Your free plan includes ${limit} site. Upgrade to Basic for more.`,
    };
  }
  if (plan === "free" && ip && (await ipSiteCount(ip)) >= FREE_SITES_PER_IP) {
    return {
      ok: false,
      reason: "You've reached the free limit for this network. Upgrade for more sites.",
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
    updatedAt: Date.now(),
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
    const rows = await sql<SiteRow[]>`
      select id, slug, name, domain, theme, accent,
             custom_domain, custom_domain_verified, custom_domain_verify_token,
             created_at, updated_at, data
        from sites where email = ${key(email)} order by created_at desc`;
    return rows.map(rowToStoredSite);
  }
  return [...memAcc(email).sites].sort((a, b) => b.createdAt - a.createdAt);
}

/** All published slugs — used by sitemap.xml. */
export async function listPublishedSlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<{ slug: string; updated_at: Date | null; created_at: Date }[]>`
      select slug, coalesce(updated_at, created_at) as updated_at, created_at
        from sites order by coalesce(updated_at, created_at) desc`;
    return rows.map((r) => ({
      slug: r.slug,
      updatedAt: new Date(r.updated_at ?? r.created_at),
    }));
  }
  const out: { slug: string; updatedAt: Date }[] = [];
  for (const a of mem.values()) {
    for (const s of a.sites) {
      out.push({ slug: s.slug, updatedAt: new Date(s.updatedAt) });
    }
  }
  return out.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getSiteById(
  email: string,
  id: string
): Promise<StoredSite | null> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<SiteRow[]>`
      select id, slug, name, domain, theme, accent,
             custom_domain, custom_domain_verified, custom_domain_verify_token,
             created_at, updated_at, data
        from sites where id = ${id} and email = ${key(email)} limit 1`;
    const r = rows[0];
    return r ? rowToStoredSite(r) : null;
  }
  return memAcc(email).sites.find((s) => s.id === id) ?? null;
}

export async function updateSite(
  email: string,
  id: string,
  site: SiteData
): Promise<StoredSite | null> {
  const now = Date.now();
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<SiteRow[]>`
      update sites
         set name = ${site.identity.name},
             domain = ${site.identity.domain},
             theme = ${site.theme},
             accent = ${site.accent ?? null},
             data = ${sql.json(JSON.parse(JSON.stringify(site)))},
             updated_at = to_timestamp(${now} / 1000.0)
       where id = ${id} and email = ${key(email)}
       returning id, slug, name, domain, theme, accent,
                custom_domain, custom_domain_verified, custom_domain_verify_token,
                created_at, updated_at, data`;
    const r = rows[0];
    return r ? rowToStoredSite(r) : null;
  }
  const a = memAcc(email);
  const i = a.sites.findIndex((s) => s.id === id);
  if (i === -1) return null;
  const prev = a.sites[i];
  const updated: StoredSite = {
    ...prev,
    name: site.identity.name,
    domain: site.identity.domain,
    theme: site.theme,
    accent: site.accent,
    updatedAt: now,
    site,
  };
  a.sites[i] = updated;
  return updated;
}

/** Account email that owns a site — used for booking notifications. */
export async function getSiteOwnerEmail(siteId: string): Promise<string | null> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<{ email: string }[]>`
      select email from sites where id = ${siteId} limit 1`;
    return rows[0]?.email ?? null;
  }
  for (const [email, a] of mem.entries()) {
    if (a.sites.some((s) => s.id === siteId)) return email;
  }
  return null;
}

export async function patchSiteCustomDomain(
  email: string,
  id: string,
  patch: {
    customDomain: string | null;
    customDomainVerified: boolean;
    customDomainVerifyToken: string | null;
  }
): Promise<StoredSite | null> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<SiteRow[]>`
      update sites set
        custom_domain = ${patch.customDomain},
        custom_domain_verified = ${patch.customDomainVerified},
        custom_domain_verify_token = ${patch.customDomainVerifyToken}
      where id = ${id} and email = ${key(email)}
      returning id, slug, name, domain, theme, accent,
                custom_domain, custom_domain_verified, custom_domain_verify_token,
                created_at, updated_at, data`;
    const r = rows[0];
    return r ? rowToStoredSite(r) : null;
  }
  const a = memAcc(email);
  const i = a.sites.findIndex((s) => s.id === id);
  if (i === -1) return null;
  const prev = a.sites[i];
  const updated: StoredSite = {
    ...prev,
    customDomain: patch.customDomain ?? undefined,
    customDomainVerified: patch.customDomainVerified,
    customDomainVerifyToken: patch.customDomainVerifyToken ?? undefined,
  };
  a.sites[i] = updated;
  return updated;
}

export async function isCustomDomainTaken(
  domain: string,
  exceptSiteId: string
): Promise<boolean> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<{ id: string }[]>`
      select id from sites
       where custom_domain = ${domain} and id <> ${exceptSiteId}
       limit 1`;
    return rows.length > 0;
  }
  for (const a of mem.values()) {
    for (const s of a.sites) {
      if (s.id !== exceptSiteId && s.customDomain === domain) return true;
    }
  }
  return false;
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
