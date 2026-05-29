import "server-only";

import { ensureSchema, getSql } from "@/lib/db";

// One-time codes. Postgres-backed when DATABASE_URL is set (works across
// serverless instances — request and verify may hit different ones); in-memory
// fallback otherwise.

const TTL_MS = 10 * 60 * 1000; // 10 min
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

interface Entry {
  code: string;
  expires: number;
  attempts: number;
  lastSent: number;
}
const mem = new Map<string, Entry>();

/** Returns a 6-digit code, or null if one was sent too recently. */
export async function createOtp(email: string): Promise<string | null> {
  const key = normalizeEmail(email);
  const now = Date.now();
  const code = genCode();
  const sql = getSql();

  if (sql) {
    await ensureSchema();
    const rows = await sql<{ last_sent: string }[]>`select last_sent from otps where email = ${key}`;
    if (rows[0] && now - Number(rows[0].last_sent) < RESEND_COOLDOWN_MS) return null;
    await sql`
      insert into otps (email, code, expires, attempts, last_sent)
      values (${key}, ${code}, ${now + TTL_MS}, 0, ${now})
      on conflict (email) do update set
        code = ${code}, expires = ${now + TTL_MS}, attempts = 0, last_sent = ${now}`;
    return code;
  }

  const existing = mem.get(key);
  if (existing && now - existing.lastSent < RESEND_COOLDOWN_MS) return null;
  mem.set(key, { code, expires: now + TTL_MS, attempts: 0, lastSent: now });
  return code;
}

export type VerifyResult = "ok" | "invalid" | "expired" | "too_many";

export async function verifyOtp(email: string, code: string): Promise<VerifyResult> {
  const key = normalizeEmail(email);
  const now = Date.now();
  const sql = getSql();

  if (sql) {
    await ensureSchema();
    const rows = await sql<
      { code: string; expires: string; attempts: number }[]
    >`select code, expires, attempts from otps where email = ${key}`;
    const row = rows[0];
    if (!row) return "expired";
    if (now > Number(row.expires)) {
      await sql`delete from otps where email = ${key}`;
      return "expired";
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      await sql`delete from otps where email = ${key}`;
      return "too_many";
    }
    if (row.code !== code.trim()) {
      await sql`update otps set attempts = attempts + 1 where email = ${key}`;
      return "invalid";
    }
    await sql`delete from otps where email = ${key}`;
    return "ok";
  }

  const entry = mem.get(key);
  if (!entry) return "expired";
  if (now > entry.expires) {
    mem.delete(key);
    return "expired";
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    mem.delete(key);
    return "too_many";
  }
  if (entry.code !== code.trim()) {
    entry.attempts += 1;
    return "invalid";
  }
  mem.delete(key);
  return "ok";
}
