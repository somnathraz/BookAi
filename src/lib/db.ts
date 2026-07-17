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
    onnotice: (notice) => {
      // Idempotent schema setup emits these on every fresh server process.
      if (notice.code === "42P07" || notice.code === "42701") return;
      console.warn("[db]", notice);
    },
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
    await sql`alter table accounts add column if not exists razorpay_subscription_id text`;
    await sql`alter table accounts add column if not exists billing_period text`;
    await sql`alter table accounts add column if not exists billing_status text`;
    await sql`alter table accounts add column if not exists billing_updated_at timestamptz`;
    await sql`alter table accounts add column if not exists billing_started_at timestamptz`;
    await sql`alter table accounts add column if not exists billing_current_start timestamptz`;
    await sql`alter table accounts add column if not exists billing_current_end timestamptz`;
    await sql`alter table accounts add column if not exists billing_charge_at timestamptz`;
    await sql`alter table accounts add column if not exists billing_cancel_at_cycle_end boolean default false`;
    await sql`alter table accounts add column if not exists billing_cancelled_at timestamptz`;
    await sql`alter table accounts add column if not exists billing_last_reminder_at timestamptz`;
    await sql`alter table accounts add column if not exists welcome_email_sent_at timestamptz`;
    await sql`alter table accounts add column if not exists upgrade_nudge_sent_at timestamptz`;
    await sql`
      create index if not exists accounts_subscription_idx
        on accounts (razorpay_subscription_id)`;
    await sql`
      create index if not exists accounts_billing_charge_idx
        on accounts (billing_charge_at desc)`;
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
    await sql`alter table sites add column if not exists updated_at timestamptz`;
    await sql`
      update sites set updated_at = created_at where updated_at is null`;
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
    await sql`
      create table if not exists bookings (
        id            uuid primary key,
        site_id       uuid not null,
        slug          text not null,
        status        text not null default 'pending',
        visitor_name  text not null,
        visitor_phone text not null,
        visitor_email text,
        preferred_date date,
        preferred_time text,
        service       text,
        notes         text,
        source        text not null default 'form',
        ip            text,
        created_at    timestamptz not null default now()
      )`;
    await sql`
      create index if not exists bookings_site_id_idx
        on bookings (site_id, created_at desc)`;
    await sql`alter table bookings add column if not exists slot_start timestamptz`;
    await sql`
      create unique index if not exists bookings_site_slot_unique
        on bookings (site_id, slot_start)
        where slot_start is not null and status not in ('cancelled')`;
    // Older installs created bookings without a foreign key. Remove any
    // already-orphaned rows before adding the cascade so deleting a site also
    // permanently removes its customer submissions in the same transaction.
    await sql`
      delete from bookings b
       where not exists (select 1 from sites s where s.id = b.site_id)`;
    await sql`
      do $$
      begin
        if not exists (
          select 1
            from pg_constraint
           where conname = 'bookings_site_id_fk'
             and conrelid = 'bookings'::regclass
        ) then
          alter table bookings
            add constraint bookings_site_id_fk
            foreign key (site_id) references sites(id) on delete cascade;
        end if;
      end
      $$`;
    await sql`
      create table if not exists deleted_site_slugs (
        slug_hash  text primary key,
        deleted_at timestamptz not null default now()
      )`;
    await sql`
      create table if not exists notify_requests (
        id         bigserial primary key,
        source     text not null,
        email      text,
        ip         text,
        created_at timestamptz not null default now()
      )`;
    await sql`
      create index if not exists notify_requests_source_idx
        on notify_requests (source, created_at desc)`;
    await sql`
      create unique index if not exists notify_requests_source_email_idx
        on notify_requests (source, email)
        where email is not null`;
    await sql`alter table sites add column if not exists custom_domain text`;
    await sql`alter table sites add column if not exists custom_domain_verified boolean default false`;
    await sql`alter table sites add column if not exists custom_domain_verify_token text`;
    await sql`
      create unique index if not exists sites_custom_domain_idx
        on sites (custom_domain)
        where custom_domain is not null`;
    await sql`
      create table if not exists site_feedback (
        id         bigserial primary key,
        site_id    uuid not null,
        email      text not null,
        rating     int not null check (rating between 1 and 5),
        comment    text,
        created_at timestamptz not null default now()
      )`;
    await sql`
      create index if not exists site_feedback_site_idx
        on site_feedback (site_id, created_at desc)`;
    await sql`
      create table if not exists account_feedback (
        email             text primary key,
        rating            int not null check (rating between 1 and 5),
        experience        text,
        desired_features  text,
        feature_tags      text[] not null default '{}',
        site_id           uuid,
        created_at        timestamptz not null default now(),
        updated_at        timestamptz not null default now()
      )`;
  })();
  return _schemaReady;
}
