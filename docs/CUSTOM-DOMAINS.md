# Wildcard subdomain sites (`glamzone.sites.kritvani.com`)

This guide turns on **subdomain publishing** so every generated site is served at
`https://<slug>.<your-domain>` instead of `kritvani.com/<slug>`.

The code is already wired:

- `src/proxy.ts` rewrites `<slug>.<domain>` → the `/[slug]` route.
- `src/lib/site-url.ts` builds `https://<slug>.<domain>` share links.
- Path URLs (`kritvani.com/<slug>`) keep working as a fallback.

Production setup for Kritvani: the builder app is on `builder.kritvani.com`, customer sites are on
`<slug>.sites.kritvani.com`. DNS stays on Cloudflare (the domain is registered there,
so its nameservers can't move to Vercel).

---

## 1. Env vars (Vercel → book-ai → Settings → Environment Variables)

```bash
NEXT_PUBLIC_APP_URL=https://builder.kritvani.com
NEXT_PUBLIC_SITE_DOMAIN=sites.kritvani.com
```

`NEXT_PUBLIC_SITE_DOMAIN` is the root that customer slugs sit under, **not** the apex.
Set it to `off` to fall back to path URLs (`builder.kritvani.com/<slug>`) — this is the
current production value until the `*.sites.kritvani.com` wildcard certificate is issued.
Changing it needs a redeploy (it's baked into the client bundle).

Local dev doesn't need either — `<slug>.localhost:3000` works out of the box.

---

## 2. Domains on the `book-ai` Vercel project

| Domain | Purpose |
| --- | --- |
| `builder.kritvani.com` | App, marketing, blog, path URLs (`builder.kritvani.com/<slug>`) |
| `*.sites.kritvani.com` | Every customer site |
| `paperchaiapp.com`, `www.`, `*.` | Legacy — proxy.ts 308s to the kritvani equivalents until the domain lapses |

The invoice app (`paperchai` Vercel project) lives separately at `paperchai.kritvani.com`.
The bare `kritvani.com` / `www` serve a separate static brand page (Vercel project `kritvani-home`).

---

## 3. Cloudflare DNS (zone `kritvani.com`) — all **DNS only / grey cloud**

| Type | Name | Value |
| --- | --- | --- |
| `A` | `@` | `216.198.79.1` (brand page) |
| `A` | `@` | `64.29.17.1` (brand page) |
| `CNAME` | `www` | Vercel (brand page) |
| `CNAME` | `builder` | `72a53af7970d38c3.vercel-dns-017.com` |
| `CNAME` | `*.sites` | `72a53af7970d38c3.vercel-dns-017.com` |
| `NS` | `_acme-challenge.sites` | `ns1.vercel-dns.com` |
| `NS` | `_acme-challenge.sites` | `ns2.vercel-dns.com` |
| `CNAME` | `paperchai` | `e97b9202ee30ce22.vercel-dns-017.com` (invoice app) |

The two `NS` records delegate only the ACME challenge to Vercel, which lets Vercel
issue the `*.sites.kritvani.com` wildcard certificate while everything else stays on
Cloudflare. Don't proxy (orange-cloud) any of these — it breaks Vercel's SSL.

Record values come from Vercel → Domains (or `get_domain_config`); re-check them there
if Vercel ever changes its recommended targets.

---

## 4. Verify

1. `https://builder.kritvani.com` renders the app.
2. `https://<slug>.sites.kritvani.com` renders that site; `https://builder.kritvani.com/<slug>` still works.
3. `https://paperchaiapp.com/anything` 308s to `https://builder.kritvani.com/anything`.

Local dev check (no DNS needed):

```bash
npm run dev
# open:
http://glamzone.localhost:3000
```

---

## How it works (quick reference)

```
Request: glamzone.sites.kritvani.com/
        │
        ▼
src/proxy.ts
  host = "glamzone.sites.kritvani.com"
  root = NEXT_PUBLIC_SITE_DOMAIN = "sites.kritvani.com"
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

- A `*.sites.kritvani.com` wildcard domain works on **all Vercel plans**, including
  **Hobby (free)** — wildcard SSL works via the `_acme-challenge` NS delegation above.
- Vercel **Hobby is non-commercial**. For a paid product, move to **Pro** (~$20/mo)
  for terms compliance and higher limits.
- This sets up subdomains on **your** domain. Letting customers point **their own**
  domain (`www.theirbiz.com`) is built — see below.

---

## 5. Owner custom domains (`www.theirbiz.com`)

Dashboard → **Settings** → **Custom domain** (Basic or Pro).

### Flow

1. Owner enters `theirbiz.com` and saves.
2. Kritvani shows two DNS records:
   - **TXT** `_kritvani-verification.theirbiz.com` = verification token (proves ownership)
   - **CNAME** `www` → `{slug}.sites.kritvani.com`
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
