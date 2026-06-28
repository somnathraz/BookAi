# Post-publish editing — TODO

> **Goal:** Let a verified owner re-open a published site, tweak copy/sections, and republish — **same slug, same URL**, no extra site slot consumed.

Status: **Not started** · Target: **v2**

### Done before edit mode

- [x] **Publish redirect** — after generate, `window.location.assign()` to canonical live URL (not inline preview)
- [x] **Canonical URL** — `APP_DOMAIN` + `getPublicSiteUrl(slug, { host })` so links use `paperchaiapp.com` / `<slug>.paperchaiapp.com`, not Vercel preview URLs; local dev uses `<slug>.localhost:3000`

---

## Problem today

| What works | What breaks |
|------------|-------------|
| Sites persist in Postgres (`sites.data` jsonb) | No `updateSite` — only `addSite` + `deleteSite` |
| Dashboard lists sites (id, slug, meta) | Dashboard has **Open** + **Delete** only — no **Edit** |
| Preview bar has **Edit** → goes back to `BuilderForm` | **Republish** always `POST /api/generate` → creates a **new** site + slug |
| `canGenerate()` blocks when free limit reached | Editing after publish hits **402 limit_reached** even for the same site |
| `SiteData` is the render contract | `BuilderForm` only edits a **subset** (`GeneratorInput`) — sections, design, gallery, menu, FAQ, etc. are not editable in the form |

**Net:** Users can tweak the form in-session before leaving preview, but cannot return days later and republish. The preview **Edit** button is misleading once they understand republish would fail or create a duplicate.

---

## Proposed UX

### Entry points

1. **Dashboard** — `Edit` button on each site card → `/edit/[id]` (or `/?edit=<id>`)
2. **Preview bar** (post-publish) — `Edit` → review step with `siteId` set; **Save & publish** updates in place
3. **Deep link** — `paperchaiapp.com/edit/<id>` (auth-gated)

### Edit flow (MVP)

```
Dashboard "Edit"
  → fetch owned site (GET /api/sites/:id)
  → siteToGeneratorInput(site) → BuilderForm pre-filled
  → user edits → "Save & publish"
  → POST /api/generate { ...input, siteId }  OR  PATCH /api/sites/:id
  → same slug returned → preview / live URL unchanged
```

### Copy for buttons

| Context | Primary CTA | Secondary |
|---------|-------------|-----------|
| Create flow | Generate site | — |
| Edit flow | **Save & publish** | Discard changes |
| Preview (edit mode) | Save & publish | Back to form |

---

## Architecture decisions

### 1. Create vs update API

**Recommended (MVP):** Extend `POST /api/generate` with optional `siteId`.

```ts
// Request body addition
{ siteId?: string; ...GeneratorInput }

// Behavior
if (siteId) → updateSite(email, siteId, newSiteData)  // skip canGenerate
else        → canGenerate() → addSite(...)
```

**Alternative:** `PATCH /api/sites/:id` with full `SiteData` body (no AI regen). Simpler for “tweak text only” later; harder to wire to BuilderForm initially.

**Decision:** Start with `siteId` on generate (reuses AI + template pipeline). Add lightweight `PATCH` in phase 2 for direct `SiteData` edits without burning an AI call.

### 2. Slug stability

- **Default:** Keep slug on update (URL never breaks).
- **Optional later:** If `identity.name` changes materially, offer “Update URL slug?” with warning about broken links.
- **MVP:** Never auto-change slug.

### 3. Rate limits

| Route | Create | Update |
|-------|--------|--------|
| `generate` expensive limit | Yes | Yes (prevent abuse) but **do not** count toward site quota |
| Site slot (`canGenerate`) | Enforced | **Skipped** when `siteId` present and owned |

### 4. Auth

- All edit endpoints require verified session (`emailFromRequest`).
- `getSiteById(email, id)` must verify `sites.email = session email`.
- Return `404` (not `403`) for wrong owner to avoid id enumeration.

### 5. `SiteData` ↔ `GeneratorInput` mapping

New util: `src/lib/site-to-input.ts`

```ts
siteToGeneratorInput(site: SiteData): GeneratorInput
```

Map:

| SiteData field | GeneratorInput field |
|----------------|---------------------|
| `identity.*` | `name`, `domain`, `tagline`, `bio` ← `bio.body`, `location`, `email`, `phone`, `photo`, `socials` |
| `theme`, `accent`, `archetype` | same |
| `services`, `work`, `projects`, `skills`, … | same shape |
| `testimonials` | same |
| `gallery`, `storeHours`, `mapEmbedUrl`, `mapsUrl` | pass through on regen |
| `sections`, `design`, `heroLayout`, `sectionLabels`, `cta` | **not in form** — preserve from existing site on update unless user toggles “Regenerate layout with AI” |

**Important:** On update, merge AI/template output with **preserved** fields the form doesn’t touch (`sections`, `design`, `heroLayout`, `gallery`, `menu`, `faq`, `storeHours`) unless user explicitly opts into full regen.

### 6. Database

Add `updated_at` column (migration in `ensureSchema`):

```sql
alter table sites add column if not exists updated_at timestamptz;
-- backfill: updated_at = created_at where null
```

Use `updated_at` in sitemap (`listPublishedSlugs`).

---

## Implementation phases

### Phase 1 — Backend (unblocks everything)

- [ ] `getSiteById(email, id): Promise<StoredSite | null>` in `src/lib/accounts.ts`
- [ ] `updateSite(email, id, site: SiteData): Promise<StoredSite | null>` — same row, same slug, refresh `name`/`domain`/`theme`/`accent` columns from `site`
- [ ] `updated_at` column + backfill in `ensureSchema()`
- [ ] `GET /api/sites/[id]/route.ts` — return full site for owner
- [ ] `POST /api/generate` — accept `siteId`; branch to `updateSite`; skip `canGenerate` when updating owned site
- [ ] `siteToGeneratorInput()` in `src/lib/site-to-input.ts`
- [ ] `mergeSiteOnUpdate(existing: SiteData, generated: SiteData): SiteData` — preserve non-form fields
- [ ] Tests / manual checklist (see below)

### Phase 2 — Studio edit mode

- [ ] `Studio` state: `editingSiteId: string | null`
- [ ] Load edit context: `/?edit=<id>` query param **or** dedicated `/edit/[id]/page.tsx` wrapping `Studio`
- [ ] On mount with `edit` param: fetch site → `siteToGeneratorInput` → `setInitialValues` → `setEditingSiteId` → `setStep("review")`
- [ ] `doGenerate`: include `siteId: editingSiteId` in body when set
- [ ] UI: heading “Edit your site” vs “Build your site”; CTA “Save & publish”
- [ ] Preview bar: republish uses same `siteId` (don’t clear on back-to-review)
- [ ] `resetToChooser` clears `editingSiteId`; `?new` still starts fresh

### Phase 3 — Dashboard + discoverability

- [ ] **Edit** button on each site card → `/edit/[id]` or `/?edit=[id]`
- [ ] Show `updated_at` on card when different from `created_at`
- [ ] Empty-state copy: “You can edit and republish anytime”

### Phase 4 — Richer editing (post-MVP)

- [ ] **Direct patch editor** — `PATCH /api/sites/:id` with partial `SiteData` (no AI)
- [ ] **Section editor** — reorder / toggle sections (`sections[]`)
- [ ] **Inline preview edit** — click text on preview to edit (big UX lift)
- [ ] **Regenerate layout** toggle — opt-in to re-run AI for `sections` + `design`
- [ ] **Form gaps** — menu, FAQ, gallery, experience/projects rows in `BuilderForm`
- [ ] **Version history** — `site_revisions` table (optional, Pro feature)
- [ ] **Undo** — session-local undo stack in editor

---

## Files to touch (Phase 1–3)

| File | Change |
|------|--------|
| `src/lib/accounts.ts` | `getSiteById`, `updateSite`, `updated_at` |
| `src/lib/db.ts` | schema migration for `updated_at` |
| `src/lib/site-to-input.ts` | **new** — mapping util |
| `src/lib/merge-site-update.ts` | **new** — preserve sections/design on regen |
| `src/app/api/generate/route.ts` | `siteId` branch |
| `src/app/api/sites/[id]/route.ts` | **new** — GET for owner |
| `src/components/generator/Studio.tsx` | edit mode, `siteId` in generate |
| `src/app/edit/[id]/page.tsx` | **new** (or query param on `/`) |
| `src/app/dashboard/page.tsx` | Edit button + link |
| `src/lib/studio-draft.ts` | optionally persist `editingSiteId` |
| `src/app/sitemap.ts` | use `updated_at` if present |

---

## Edge cases

- [ ] User deletes site while edit tab open → 404 on save, toast + redirect dashboard
- [ ] Session expired mid-edit → 401 on save → EmailGate, restore draft after verify
- [ ] `useAI: false` on edit → template regen, still merge preserved sections
- [ ] Large `photo` data URL in jsonb → already stored; no change
- [ ] In-memory fallback (no `DATABASE_URL`) → same update logic in `mem` map
- [ ] Subdomain URL after edit → unchanged (`getPublicSiteUrl(slug)`)

---

## Manual test plan

1. Create site A → note slug URL
2. Dashboard → **Edit** → change tagline + one service → **Save & publish**
3. Live URL unchanged; content updated on hard refresh
4. Free plan: confirm edit does **not** block with “used your free site”
5. Confirm creating site B still blocked on free plan (only 1 slot)
6. Preview **Edit** → change bio → republish → live site reflects change
7. Rate limit: many rapid updates still respect `RATE_LIMIT_EXPENSIVE_HOUR`
8. Wrong `siteId` / another user’s id → 404

---

## Open questions

1. **Full regen default?** On edit, should AI rewrite all copy from form, or only changed fields?  
   → **MVP:** full regen from form input (same as create), merge preserved structure fields.

2. **Edit without AI key?** Template fallback only — acceptable?

3. **Pricing gate:** “Unlimited edits” is on Basic tier (marked soon). Gate edits behind plan now or allow on free for v2 launch?  
   → **Suggest:** unlimited edits on free for retention; gate custom domain / branding removal instead.

4. **Route shape:** `/edit/[id]` vs `/?edit=[id]`?  
   → **Suggest:** `/edit/[id]` — clearer, shareable, doesn’t collide with studio draft restore.

---

## Success criteria

- [ ] Owner can edit and republish without consuming an extra site slot
- [ ] Published URL (slug) stable across edits
- [ ] Dashboard + preview both reach edit flow
- [ ] Free-user with 1 site can edit that site indefinitely
- [ ] No regression on create flow

---

*Last updated: 2026-06-10*
