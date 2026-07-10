import { NextResponse } from "next/server";

import { ipFromRequest } from "@/lib/abuse";
import { ensureSchema, getSql } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { emailFromRequest } from "@/lib/session";

export const runtime = "nodejs";

// Coming-soon sources users can ask to be notified about. Keep in sync with
// the Coming soon section on the home page.
const SOURCES = new Set([
  "instagram",
  "facebook",
  "youtube",
  "resume",
  "website",
  "notion",
  "github",
  "linkedin",
  "languages",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface NotifyBody {
  source?: string;
  email?: string;
  /** Honeypot — must be empty. */
  website?: string;
}

// In-memory fallback so the flow still works in dev without Postgres.
const memVotes = new Map<string, Set<string>>();

export async function POST(request: Request) {
  let body: NotifyBody;
  try {
    body = (await request.json()) as NotifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.website?.trim()) return NextResponse.json({ ok: true });

  const source = body.source?.trim().toLowerCase();
  if (!source || !SOURCES.has(source)) {
    return NextResponse.json({ error: "Unknown source." }, { status: 400 });
  }

  // Prefer explicit email, fall back to the verified session email.
  const email =
    body.email?.trim().toLowerCase() || emailFromRequest(request)?.toLowerCase() || null;
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const limited = await enforceRateLimit(request, "notify");
  if (!limited.allowed) return rateLimitResponse(limited);

  const ip = ipFromRequest(request) ?? null;
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    if (email) {
      // One row per (source, email); repeat clicks are idempotent.
      await sql`
        insert into notify_requests (source, email, ip)
        values (${source}, ${email}, ${ip})
        on conflict (source, email) where email is not null do nothing`;
    } else {
      await sql`
        insert into notify_requests (source, email, ip)
        values (${source}, ${null}, ${ip})`;
    }
  } else {
    const set = memVotes.get(source) ?? new Set<string>();
    set.add(email ?? `ip:${ip ?? "unknown"}:${Date.now()}`);
    memVotes.set(source, set);
  }

  return NextResponse.json({ ok: true });
}
