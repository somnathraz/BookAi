---
name: write-paperchai-blog
description: >-
  Write or update PaperChai journal posts in blog-registry.ts with current
  Google SEO rules (snippets, alt text, BlogPosting schema, sitemap freshness,
  people-first India local-business content). Use when adding a blog article,
  journal post, or SEO content for /blog.
---

# Write PaperChai blog (SEO-ready)

## When to use

Use this skill whenever you add or materially edit an entry in
`src/features/content/blog/blog-registry.ts`.

Also read `src/features/content/blog/CODEX_BLOG_PROMPT.md` if you need the
copy-paste Codex brief.

## Hard rules (Google Search Central aligned, 2026)

1. **People-first content** — solve one real local-business or freelancer task in India. No keyword stuffing, no doorway pages, no near-duplicate of an existing slug/title.
2. **Visible HTML wins** — all value must live in `sections` text. Schema/meta only describe what the page shows.
3. **One URL, one intent** — unique `slug`. Check the registry first; never reuse a slug.
4. **Snippets** — title ~45–60 chars (layout adds ` — PaperChai`); description 140–160 chars, benefit-first, no trailing keyword lists.
5. **Alt text** — one short, accurate sentence of what the image shows + context. No “image of…”, no keyword dumps. Decorative-only images would use `alt=""` (heroes are meaningful, so always write real alt).
6. **Schema we already emit** — `BlogPosting` + `BreadcrumbList` from registry fields. Do **not** invent FAQ/HowTo rich-result markup (Google retired those rich results). Do not add fake author Persons.
7. **Sitemap freshness** — set `updatedAt` when you edit an existing post; keep `publishedAt` stable. Dates are `YYYY-MM-DD`.
8. **Internal links** — in body copy, mention related PaperChai journal topics naturally when useful; related-rail is automatic by category.
9. **No Semrush/Similarweb dependency** — write for Search Console + helpful content, not third-party “SEO score” APIs.
10. **Ship only registry entries** — no new MDX/CMS files; append one object at the **top** of `blogRegistry`.

## Output contract

Append **one** `BlogArticle` object at the top of `blogRegistry` (newest first).

```ts
{
  slug: "kebab-case-unique-intent-india", // 4–10 words, no dates
  title: "Clear task-focused title under ~60 chars",
  description: "140–160 chars. State the outcome for an Indian local business or independent professional.",
  category: "Local growth" | "Website foundations" | "PaperChai workflow" | "PaperChai guides" | "Independent work" | "Practical guide",
  publishedAt: "YYYY-MM-DD", // today UTC unless scheduled
  updatedAt: "YYYY-MM-DD",   // same as publishedAt for new posts
  readingMinutes: 7,         // match real length (~900–1200 words → 7–8)
  image: "https://images.unsplash.com/photo-...?auto=format&fit=crop&w=1800&q=85",
  imageAlt: "Concrete scene description without keyword stuffing",
  keywords: [
    "primary phrase with India/local intent",
    "secondary how-to phrase",
    "tertiary related phrase",
  ], // 3–5 items
  promotionCaption?: "Optional social caption",
  sections: [
    {
      heading: "H2 that states a step or decision",
      paragraphs: [
        "2–4 sentences. Practical, specific, honest. No hype rankings promises.",
        "Second paragraph with example (salon, tutor, repair, freelancer) when useful.",
      ],
    },
    // 5–7 sections total
  ],
}
```

## SEO field checklist

| Field | Rule |
|--------|------|
| `slug` | Unique; mirrors primary intent; lowercase kebab-case |
| `title` | One intent; readable; avoid stuffing “India” more than once unless natural |
| `description` | SERP snippet; benefit + constraint; ≤160 chars |
| `keywords` | Research-like phrases for meta only; do not repeat them as a list in body |
| `imageAlt` | Describe the photo’s content/purpose; ≤125 chars preferred |
| `publishedAt` / `updatedAt` | Accurate; never future-fake beyond real publish day |
| `sections` | 5–7 H2s; ~900–1200 words; first section answers “what/why”; last section = maintain/review |
| Category | Prefer existing categories; don’t invent new ones without product need |

## Content quality (anti-spam)

- Differentiate from the closest existing post (read 2–3 related registry titles first).
- Prefer checklists, privacy/safety, ownership of Google/domain access, and mobile customer paths.
- Never promise rankings, guaranteed Maps placement, or instant indexing.
- Avoid cloning WhatsApp / booking / FAQ posts with only wording changes.
- Ground claims in what a business owner can actually do in Google Business Profile, Search Console, or their website.

## After writing

1. Confirm `getBlogArticle` can find the new slug (unique).
2. Do not hand-edit sitemap/RSS — they read the registry.
3. Run typecheck if the registry shape changed.
4. Remind the human: deploy, then Search Console URL Inspection for the new URL.

## Pasteable user prompt (for Codex)

```text
Add one new PaperChai journal article to src/features/content/blog/blog-registry.ts
following .cursor/skills/write-paperchai-blog/SKILL.md and
src/features/content/blog/CODEX_BLOG_PROMPT.md.

Topic: <TOPIC>
Audience: Indian local service business or independent professional
Must be unique vs existing slugs/titles in the registry.
Output: single BlogArticle object prepended to blogRegistry. No other files unless types require it.
```
