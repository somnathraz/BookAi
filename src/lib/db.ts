import "server-only";

import postgres from "postgres";

// Single Postgres connection via DATABASE_URL. Works with local Postgres,
// Neon, or Supabase — they're all Postgres, only the connection string differs.
// When DATABASE_URL is unset, getSql() returns null and the app falls back to
// in-memory stores (so dev still runs with no DB).

type Sql = ReturnType<typeof postgres>;

let _sql: Sql | null | undefined;

function isLocal(url: string): boolean {
  return url.includes("localhost") || url.includes("127.0.0.1") || url.includes("@/");
}

function isLocalhostInProd(url: string): boolean {
  return process.env.NODE_ENV === "production" && isLocal(url);
}

/** Vercel's Neon integration often prefixes vars (e.g. bookAi_DATABASE_URL). */
function resolveDatabaseUrl(): string | undefined {
  const names = [
    "DATABASE_URL",
    "bookAi_DATABASE_URL",
    "POSTGRES_URL",
    "bookAi_POSTGRES_URL",
    "bookAi_POSTGRES_PRISMA_URL",
  ];
  for (const name of names) {
    const v = process.env[name]?.trim();
    if (v) return v;
  }
  return undefined;
}

export function getSql(): Sql | null {
  if (_sql !== undefined) return _sql;
  const url = resolveDatabaseUrl();
  if (!url) {
    _sql = null;
    return null;
  }
  // Localhost DATABASE_URL in production = misconfiguration. Fail fast with a
  // clear log and fall back to in-memory so the app still runs, rather than
  // crashing every request with ECONNREFUSED.
  if (isLocalhostInProd(url)) {
    console.error(
      "[db] DATABASE_URL points to localhost in production. " +
        "Set it to your Neon/Supabase connection string in the Vercel dashboard. " +
        "Falling back to in-memory store — OTP codes will NOT survive across serverless instances."
    );
    _sql = null;
    return null;
  }
  _sql = postgres(url, {
    // Neon/Supabase require TLS; local Postgres usually doesn't.
    ssl: isLocal(url) ? false : "require",
    max: 5,
    idle_timeout: 20,
  });
  return _sql;
}

export function dbEnabled(): boolean {
  return getSql() !== null;
}

let _schemaReady: Promise<void> | null = null;

// Lazily create tables on first use (idempotent). Safe to call on every request.
// If the schema creation fails (e.g. transient network error) the cached promise
// is cleared so the next request can retry, rather than every request failing
// permanently with the same rejected promise.
export function ensureSchema(): Promise<void> {
  const sql = getSql();
  if (!sql) return Promise.resolve();
  if (_schemaReady) return _schemaReady;
  _schemaReady = (async () => {
    await sql`
      create table if not exists accounts (
        email      text primary key,
        plan       text not null default 'free',
        created_at timestamptz not null default now()
      )`;
    await sql`
      create table if not exists sites (
        id         uuid primary key,
        email      text not null,
        slug       text,
        name       text not null,
        domain     text not null,
        theme      text not null,
        accent     text,
        ip         text,
        data       jsonb not null,
        created_at timestamptz not null default now()
      )`;
    // Add slug to tables created before it existed (idempotent).
    await sql`alter table sites add column if not exists slug text`;
    await sql`create index if not exists sites_email_idx on sites (email)`;
    await sql`create index if not exists sites_ip_idx on sites (ip)`;
    await sql`create unique index if not exists sites_slug_idx on sites (slug)`;
    await sql`
      create table if not exists otps (
        email     text primary key,
        code      text not null,
        expires   bigint not null,
        attempts  int not null default 0,
        last_sent bigint not null
      )`;
    await sql`
      create table if not exists api_rate_events (
        id         bigserial primary key,
        bucket     text not null,
        route      text not null,
        created_at timestamptz not null default now()
      )`;
    await sql`
      create index if not exists api_rate_events_bucket_route_ts
        on api_rate_events (bucket, route, created_at desc)`;
  })();
  return _schemaReady;
}
