import "server-only";

import { ensureSchema, getSql } from "@/lib/db";
import { ipFromRequest } from "@/lib/abuse";
import { emailFromRequest } from "@/lib/session";

/** Paid / costly API groups tracked in Postgres (falls back to in-memory locally). */
export type RateLimitRoute =
  | "extract"
  | "generate"
  | "otp"
  | "proxy"
  | "auth"
  | "booking"
  | "notify";

interface LimitConfig {
  windowMs: number;
  max: number;
}

function envInt(name: string, fallback: number): number {
  const v = Number.parseInt(process.env[name]?.trim() ?? "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

const HOUR_MS = 60 * 60 * 1000;
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

function limitsFor(route: RateLimitRoute): LimitConfig {
  switch (route) {
    case "extract":
    case "generate":
      return {
        windowMs: HOUR_MS,
        max: envInt("RATE_LIMIT_EXPENSIVE_HOUR", 60),
      };
    case "otp":
      return { windowMs: FIFTEEN_MIN_MS, max: envInt("RATE_LIMIT_OTP_15MIN", 6) };
    case "proxy":
      return { windowMs: HOUR_MS, max: envInt("RATE_LIMIT_PROXY_HOUR", 120) };
    case "auth":
      return { windowMs: HOUR_MS, max: envInt("RATE_LIMIT_AUTH_HOUR", 30) };
    case "booking":
      return { windowMs: HOUR_MS, max: envInt("RATE_LIMIT_BOOKING_HOUR", 10) };
    case "notify":
      return { windowMs: HOUR_MS, max: envInt("RATE_LIMIT_NOTIFY_HOUR", 20) };
  }
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
}

export const RATE_LIMIT_MESSAGE =
  "We're handling heavy traffic from your network right now. Please try again in a few minutes.";

// ── in-memory fallback (no DATABASE_URL) ─────────────────────────────────────

const memHits = new Map<string, number[]>();

function memCount(bucket: string, windowMs: number): number {
  const now = Date.now();
  const hits = (memHits.get(bucket) ?? []).filter((t) => now - t < windowMs);
  memHits.set(bucket, hits);
  return hits.length;
}

function memRecord(bucket: string, windowMs: number): void {
  const now = Date.now();
  const hits = (memHits.get(bucket) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  memHits.set(bucket, hits);
}

// ── Postgres sliding window ────────────────────────────────────────────────────

async function dbCount(bucket: string, route: RateLimitRoute, windowMs: number): Promise<number> {
  const sql = getSql();
  if (!sql) return memCount(`${bucket}:${route}`, windowMs);

  await ensureSchema();
  const since = new Date(Date.now() - windowMs).toISOString();
  const rows = await sql<{ n: string }[]>`
    select count(*)::int as n from api_rate_events
    where bucket = ${bucket} and route = ${route} and created_at >= ${since}::timestamptz`;
  return Number(rows[0]?.n ?? 0);
}

async function dbRecord(bucket: string, route: RateLimitRoute): Promise<void> {
  const sql = getSql();
  if (!sql) {
    memRecord(`${bucket}:${route}`, limitsFor(route).windowMs);
    return;
  }

  await ensureSchema();
  await sql`
    insert into api_rate_events (bucket, route)
    values (${bucket}, ${route})`;
  // Best-effort prune — keeps the table small.
  await sql`
    delete from api_rate_events
    where created_at < now() - interval '25 hours'`;
}

function bucketsFor(request: Request, emailOverride?: string | null): string[] {
  const out: string[] = [];
  const ip = ipFromRequest(request);
  if (ip) out.push(`ip:${ip}`);
  const email = emailOverride ?? emailFromRequest(request);
  if (email) out.push(`email:${email.toLowerCase()}`);
  return out;
}

/**
 * Enforce per-IP and per-email rate limits for costly routes.
 * Returns allowed=false when any bucket is over its window budget.
 */
export async function enforceRateLimit(
  request: Request,
  route: RateLimitRoute,
  opts?: { emailOverride?: string | null; extraBuckets?: string[] }
): Promise<RateLimitResult> {
  const { windowMs, max } = limitsFor(route);
  const buckets = [
    ...bucketsFor(request, opts?.emailOverride),
    ...(opts?.extraBuckets ?? []),
  ];

  // No identifiable client — allow (local dev) but still can't attribute abuse.
  if (!buckets.length) return { allowed: true };

  let worstRetry = 0;

  for (const bucket of buckets) {
    const count = await dbCount(bucket, route, windowMs);
    if (count >= max) {
      const retryAfterSec = Math.ceil(windowMs / 1000);
      worstRetry = Math.max(worstRetry, retryAfterSec);
      return { allowed: false, retryAfterSec: worstRetry };
    }
  }

  for (const bucket of buckets) {
    await dbRecord(bucket, route);
  }

  return { allowed: true };
}
