# Wildcard subdomain sites (`glamzone.paperchaiapp.com`)

This guide turns on **subdomain publishing** so every generated site is served at
`https://<slug>.<your-domain>` instead of `paperchaiapp.com/<slug>`.

The code is already wired:

- `src/proxy.ts` rewrites `<slug>.<domain>` → the `/[slug]` route.
- `src/lib/site-url.ts` builds `https://<slug>.<domain>` share links.
- Path URLs (`paperchaiapp.com/<slug>`) keep working as a fallback.

You only need to (1) set one env var and (2) add a wildcard DNS record on Vercel.

---

## 1. Set the env var

Add your **apex domain** (no `https://`, no path) in every environment you deploy.

```bash
NEXT_PUBLIC_SITE_DOMAIN=paperchaiapp.com
```

- **Local** (`.env` / `.env.local`): optional — `<slug>.localhost:3000` works without it,
  but set it if you want to test the real domain logic.
- **Vercel**: Project → **Settings → Environment Variables** → add
  `NEXT_PUBLIC_SITE_DOMAIN = paperchaiapp.com` for **Production** (and Preview if you want).

> It must start with `NEXT_PUBLIC_` so the value is available in the browser for
> building share links. After changing it, **redeploy** (env changes need a new build).

---

## 2. Add the domains in Vercel

Project → **Settings → Domains**, then add **both**:

| Domain | Why |
| --- | --- |
| `paperchaiapp.com` | Your main app + path URLs |
| `*.paperchaiapp.com` | Every site subdomain (`glamzone.…`, `krishnas.…`, …) |

Vercel will show the DNS records it needs. The exact records depend on **where your
DNS is hosted** (see step 3).

> Add `www.paperchaiapp.com` too if you want it; the proxy treats `www` as the
> app, not a site.

---

## 3. Configure DNS

Pick the option that matches your setup.

### Option A — Domain registered with / using Vercel nameservers (easiest, recommended)

This is required for **automatic wildcard SSL** (`*` certificates).

1. In Vercel → **Settings → Domains**, add `paperchaiapp.com`.
2. Vercel shows two **nameservers**, e.g.:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
3. At your **registrar** (GoDaddy, Namecheap, Google Domains, etc.), replace the
   existing nameservers with Vercel's.
4. Wait for propagation (minutes–hours). Vercel then auto-issues SSL for both
   `paperchaiapp.com` and `*.paperchaiapp.com`.

✅ Nothing else to do — wildcard + SSL are handled by Vercel.

### Option B — Keep DNS at your provider (Cloudflare, Route53, etc.)

Add these records at your DNS provider:

| Type | Name / Host | Value | Notes |
| --- | --- | --- | --- |
| `A` | `@` (apex) | `76.76.21.21` | Vercel's apex IP (confirm the value Vercel shows you) |
| `CNAME` | `www` | `cname.vercel-dns.com` | optional |
| `CNAME` | `*` | `cname.vercel-dns.com` | **the wildcard — this is the important one** |

Then in Vercel → **Settings → Domains**, click **Refresh / Verify** on
`paperchaiapp.com` and `*.paperchaiapp.com` until both show **Valid Configuration**.

> **Cloudflare gotcha:** for the wildcard `*` record, set the proxy status to
> **DNS only (grey cloud)**, not proxied (orange cloud). Proxied wildcards can break
> Vercel's SSL issuance. Apex/www can stay proxied if you prefer.

> **Wildcard SSL note:** some providers don't issue wildcard certs unless Vercel
> controls DNS. If `*.paperchaiapp.com` won't go "Valid", use **Option A**
> (Vercel nameservers) for the wildcard.

---

## 4. Verify

After DNS is valid and you've redeployed:

1. Generate a site (note its slug, e.g. `glamzone`).
2. Visit `https://glamzone.paperchaiapp.com` → it should render that site.
3. Visit `https://paperchaiapp.com/glamzone` → still works (fallback).
4. The dashboard's **Open live site** button now points at the subdomain URL.

Local dev check (no DNS needed):

```bash
npm run dev
# open:
http://glamzone.localhost:3000
```

---

## How it works (quick reference)

```
Request: glamzone.paperchaiapp.com/
        │
        ▼
src/proxy.ts
  host = "glamzone.paperchaiapp.com"
  root = NEXT_PUBLIC_SITE_DOMAIN = "paperchaiapp.com"
  slug = "glamzone"            (apex / www / api / _next are ignored)
        │  rewrite (not redirect)
        ▼
/app/[slug]/page.tsx  →  getSiteBySlug("glamzone")  →  renders the site
```

- Reserved subdomains (`www`, `app`, `api`, `admin`, `dashboard`, …) are never
  treated as slugs — see `RESERVED_SUBDOMAINS` in `src/lib/site-url.ts`.
- Turning the feature off is just removing `NEXT_PUBLIC_SITE_DOMAIN` and redeploying;
  everything reverts to path URLs.

---

## Plan / cost notes

- A `*.paperchaiapp.com` wildcard domain works on **all Vercel plans**, including
  **Hobby (free)** — wildcard SSL just needs Vercel's nameservers (Option A).
- Vercel **Hobby is non-commercial**. For a paid product, move to **Pro** (~$20/mo)
  for terms compliance and higher limits.
- This sets up subdomains on **your** domain. Letting customers point **their own**
  domain (`www.theirbiz.com`) is built — see below.

---

## 5. Owner custom domains (`www.theirbiz.com`)

Dashboard → **Settings** → **Custom domain** (Basic or Pro).

### Flow

1. Owner enters `theirbiz.com` and saves.
2. PaperChai shows two DNS records:
   - **TXT** `_paperchai-verification.theirbiz.com` = verification token (proves ownership)
   - **CNAME** `www` → `{slug}.paperchaiapp.com`
3. Owner clicks **Check DNS** — we look up the TXT record.
4. Owner adds `www.theirbiz.com` in **Vercel → Project → Domains** (required for TLS).
5. `proxy.ts` routes `www.theirbiz.com` to the site slug.

### Dev / staging without Razorpay

Set `CUSTOM_DOMAIN_ALLOW_FREE=true` in `.env`, or set `accounts.plan` to `basic` / `pro` in Postgres.

### Code

| Piece | Path |
|-------|------|
| DNS verify + DB | `src/lib/custom-domain.ts` |
| API | `GET/PATCH/POST /api/sites/[id]/domain` |
| Proxy routing | `src/proxy.ts` |
| Dashboard UI | `src/components/dashboard/CustomDomainPanel.tsx` |
