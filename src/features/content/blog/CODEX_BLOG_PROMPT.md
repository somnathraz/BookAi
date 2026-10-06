# Codex prompt — generate next PaperChai blog (SEO 2026)

Copy everything below the line into Codex / Cursor when you want a new journal post.

---

You are writing the next PaperChai journal article for https://paperchaiapp.com/blog.

## Goal

Add **one** new entry at the **top** of `src/features/content/blog/blog-registry.ts` that is crawlable, indexable, and people-first. Match the existing `BlogArticle` TypeScript shape exactly.

## Latest SEO rules to follow (Google Search Central aligned)

### Snippets (title + description)
- Title: **45–60 characters**, one clear intent. Layout appends ` — PaperChai`, so do not put the brand in the title.
- Meta description: **140–160 characters**, benefit-first, natural language. No keyword lists at the end.
- One H1 only (the `title` field). Section `heading`s are H2s — make them task-oriented, not keyword piles.

### Sitemap / crawl freshness
- Unique `slug` (never reuse). Check the whole registry first.
- `publishedAt`: real publish date `YYYY-MM-DD`.
- `updatedAt`: same as `publishedAt` for new posts; when editing later, bump only `updatedAt`.
- Sitemap/RSS/JSON-LD are generated from the registry — do not invent separate sitemap files.

### Schema (already wired in the app)
Registry fields power `BlogPosting` + `BreadcrumbList` + `og:type=article`.
- Fill accurate `title`, `description`, `publishedAt`, `updatedAt`, `image`, `imageAlt`, `keywords`, `category`.
- **Do not** add FAQPage / HowTo rich-result schema (Google retired those rich results).
- **Do not** invent fake personal authors; publisher is PaperChai (Organization).
- Structured data must match visible content only.

### Alt text (Google Images + a11y)
- Write `imageAlt` as a short, accurate description of the scene (what a sighted user sees that matters).
- Good: `Owner checking a booking calendar on a phone in a small salon`
- Bad: `Google Business Profile booking link India SEO local service website`
- No “image of…”, no all-caps, no keyword stuffing.
- Pick a relevant Unsplash photo URL with `auto=format&fit=crop&w=1800&q=85`.

### Content quality (indexing risk if ignored)
- **900–1200 words**, 5–7 sections, `readingMinutes` 7–8.
- One specific customer job for an **Indian** local service business or independent professional.
- Must **not** be a thin rewrite of an existing WhatsApp / booking / FAQ / GBP post.
- Practical steps, ownership/privacy notes, mobile path, honest limits (no ranking guarantees).
- Prefer concrete examples (salon, tutor, clinic, repair, freelancer) over generic “businesses”.
- Internal uniqueness > publishing volume. If the topic overlaps an existing slug, pick a sharper angle or stop.

### Keywords
- 3–5 phrases for the `keywords` array (meta only).
- Do not paste the keyword list into body paragraphs.

### Categories (pick one existing)
`Local growth` · `Website foundations` · `PaperChai workflow` · `PaperChai guides` · `Independent work` · `Practical guide`

## Required object shape

```ts
{
  slug: string;              // unique kebab-case
  title: string;             // ~45–60 chars
  description: string;       // 140–160 chars
  category: string;          // existing category only
  publishedAt: string;       // YYYY-MM-DD
  updatedAt: string;         // YYYY-MM-DD
  readingMinutes: number;    // 7 or 8 for full guides
  image: string;             // Unsplash absolute URL
  imageAlt: string;          // descriptive, not stuffed
  keywords: string[];        // 3–5 phrases
  promotionCaption?: string; // optional social caption
  sections: {
    heading: string;
    paragraphs: string[];    // usually 2 paragraphs each
  }[];
}
```

## Topic for this run

**Topic:** `<REPLACE_WITH_TOPIC>`

**Audience:** Indian local service business or independent professional  
**Must differentiate from:** any existing registry titles about the same product surface (GBP, WhatsApp, Search Console, booking, FAQ).

## Done criteria

1. Object prepended to `blogRegistry` (newest first).
2. Typecheck-clean.
3. No duplicate slug.
4. Description length 140–160; title not absurdly long.
5. Body is useful without the meta fields.
6. Tell me the public URL path: `/blog/<slug>` so I can request indexing in Search Console after deploy.
