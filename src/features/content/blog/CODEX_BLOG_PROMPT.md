# PaperChai journal: research, write, verify, learn

This is the reusable editorial workflow for https://paperchaiapp.com/blog.
Read it before each scheduled or manual article run, together with AGENTS.md.
It adapts the supplied SomSite checklist to PaperChai's publishing system.

## Scope and publishing contract

- Work in /Users/somnathkhadanga/code/BookAi. Preserve unrelated work, including
  other edits in the registry. Do not commit, push, open a PR, deploy, or change
  billing, authentication, generated customer sites, or deployment settings.
- Write for Indian local service businesses, freelancers, and independent
  professionals creating or improving a website. Do not switch to SomSite's SaaS
  agency audience because an example prompt mentions it.
- Content belongs only in `src/features/content/blog/blog-registry.ts`. Match the
  actual `BlogArticle` interface. Do not introduce MDX, frontmatter, a second
  content directory, a parser dependency, or duplicate sitemap/RSS/schema files.
- Add one article at the top only after the evidence and uniqueness gates pass.
  Scheduled runs add at most one article per Asia/Kolkata calendar day; inspect
  memory and the registry first. If today's entry already exists, report it and
  skip. A manual extra article requires an explicit request.
- If no useful distinct topic survives review, skip with a reason and record the
  candidates considered. Do not publish a rewrite to satisfy a daily quota.
- On Fridays, choose a useful PaperChai workflow with product steps verified in
  the repository. Include a concise Instagram/LinkedIn image-post caption in
  `promotionCaption`. Preparing copy does not authorize posting to social media.

## 1. Analyze the site before choosing a topic

Read the whole registry's titles, slugs, keywords, and relevant article bodies.
Group by the reader's task, not just by exact keyword. Two differently worded
booking-link guides can still answer the same question. Read recent automation
memory and the latest editorial audit when present. Local changes may not be live.

Inspect the article renderer, related-link helper, metadata, sitemap, RSS, and
robots rules when their contract changes. Verify the public blog and a relevant
article when accessible. Record source inspection separately from live HTTP
verification. A failed research fetch does not prove the site is down.

Use authorized Search Console and analytics reports when available. Compare the
last complete 28 days with the previous 28 days; record property, country, device,
channel, and date filters. Review queries, landing pages, impressions, clicks,
CTR, and downstream enquiries or site creation where actually measured. Mark
partial periods and low sample sizes. A tracking helper in code is not evidence
of collected data. Do not infer conversions from views.

If account reports are unavailable, say so and continue with a public-research
hypothesis. Never invent traffic, keyword volume, difficulty, rankings, conversion
rates, or the site's best-performing article. Do not change analytics settings,
install integrations, or request credentials just to write.

## 2. Research three candidates and select one

Record a short brief for each candidate in the run notes:

1. One customer task, primary long-tail phrase, and intended reader.
2. The closest existing article and a concrete difference in task or decision.
3. At least two relevant sources with URLs, publication/update dates when known,
   and observation date. Use primary documentation for product/technical facts.
4. Demand evidence: first-party queries, public trends, observed social engagement,
   repeated customer questions, or an explicitly unvalidated hypothesis.
5. A practical deliverable: worked example, decision checklist, sample brief,
   or troubleshooting sequence.
6. A real PaperChai next step and two relevant existing blog destinations.

Prefer audience fit, original useful detail, and product relevance over raw
popularity. Reject overlaps before drafting. Do not make interchangeable city
pages or articles that only change the profession in the same advice.

For a trend claim, inspect underlying posts or reports, not only a search snippet
or an agency claiming a format is viral. Record the platform, post URL, date,
visible metric, and comparison baseline when available. Distinguish reach,
engagement, qualified traffic, and conversions. Views do not establish local buyer
intent. Without a defensible comparison, say "topic candidate", not "viral" or
"fast-growing". A product announcement can support timeliness without proving demand.

Borrow useful presentation patterns (a clear opening problem, comparable before/
after evidence, a worked example, a concise checklist), not another author's
wording, screenshots, customer stories, or unsupported claims.

## 3. Write a complete answer and a useful next step

For new full guides, write **1,200–1,600 body words**, normally in **5–7 sections**.
A clearly identified short security/news brief may be shorter when it answers the
whole task. Do not pad a small answer; select a topic with enough practical depth.
This is an editorial brief, not a Google ranking threshold. Use a realistic
`readingMinutes` estimate; 7–8 usually fits a full guide.

The body must be useful without metadata. Include:

- The specific problem and an actionable answer early.
- What breaks, with symptoms the reader can recognise.
- How to evaluate options, tradeoffs, and when an option does not fit.
- A concrete sequence and an observable success check.
- A short checklist expressed through the supported heading/paragraph structure,
  rather than raw Markdown list syntax.
- When to seek help and what information to prepare.
- A final "Next step" section connecting the advice to a relevant PaperChai action
  and the existing CTA, without a generic sales pitch.

Use one detailed example rather than naming many professions without explaining
the work. Label fictional examples illustrative. Include ownership, privacy,
mobile, accessibility, and maintenance details where they affect the task; avoid
repeating a generic closing checklist in every article.

Use a direct, honest tone. Do not invent personal testing, client results, product
capabilities, credentials, or ranking guarantees. Label performance/cost numbers
next to the claim as **verified** (source/date/method), **internal** (actual approved
measurement with period and scope), or **illustrative** (explicit assumptions).
Omit numbers that cannot be supported. Avoid celebrity filler, copied text, fake
urgency, keyword stuffing, and unsupported virality claims.

## 4. Fill metadata using the registry contract

| Supplied template concept | PaperChai representation |
| --- | --- |
| title / metaTitle | `title`, used for the visible H1 and page metadata |
| description | `description` |
| primaryKeyword / tags | Primary phrase first in `keywords`, then related phrases |
| date / updated | `publishedAt` / `updatedAt` |
| readTime / category | `readingMinutes` / an existing `category` |
| shareImage / hero Markdown | `image` and `imageAlt`, rendered by the article page |
| relatedService | Verified existing article-page CTA; no unsupported field |
| optional faq | Visible Q&A sections only when useful; no new schema |

- Use a unique descriptive kebab-case slug. Check the entire registry. Keep old
  slugs and publication dates stable.
- Aim for a 45–60-character title with one clear intent and no brand suffix; the
  layout adds PaperChai. These are house limits, not Google's display guarantees.
- Write a benefit-first **140–160-character description**, within the supplied
  120–160 range. Do not append keyword lists.
- Set `publishedAt` and `updatedAt` to the actual run's publish date, equal for
  a new post, as ISO `YYYY-MM-DD`. Only change `updatedAt` after a material edit.
- Use 3–5 natural keyword phrases, primary first. This is editorial metadata;
  Google does not use the keywords meta tag for ranking.
- Categories: Local growth, Website foundations, PaperChai workflow, PaperChai
  guides, Independent work, or Practical guide.
- Select a relevant licensed Unsplash photo with
  `auto=format&fit=crop&w=1800&q=85`. Inspect the actual photo, verify its source
  and licence, and record the source in the run notes. Never invent a depicted
  phone, person, task, or profession to make a stock image seem relevant.
- Alt text describes what is visibly present: no "image of", keyword list, or
  unverified identity. Do not duplicate the hero in the body.

## 5. Verify rendered links and article structure

The page supplies one H1 from `title`; section headings become H2s.
Paragraph strings are plain text. Do not insert raw HTML, MDX, H1s, or Markdown
links and assume they become rendered elements.

The existing Related guides block is PaperChai's Related Reading section. Verify
it contains at least **two distinct relevant internal blog links** resolving to
real registry slugs, neither the current article. Check the actual output of
`getRelatedBlogArticles`; matching a category does not ensure relevance. If the
renderer cannot meet the brief, record the limitation and stop that draft instead
of pretending raw Markdown links work.

Verify **one real conversion link** on the page. The existing creation CTA is
`/?new`; `/pricing` is another existing public destination. Use the renderer's
supported CTA. Do not invent SomSite service paths or `/contact`. A new per-article
link model belongs in a separate explicitly authorized implementation change.

Reuse BlogPosting, BreadcrumbList, article Open Graph metadata, canonical URL,
and registry-driven sitemap/RSS. Confirm metadata matches visible content.
PaperChai remains the Organization publisher; do not invent a personal author.
Do not add FAQPage or HowTo rich-result markup for this journal. If 2–4 Q&As are
useful, put them visibly in the supported section structure without repeating
another guide just to add keywords.

## 6. Verify, report, and learn

Before handoff:

1. Confirm exactly one new object, prepended; no duplicate slug, unanswered
   placeholders, or unrelated changes.
2. Count title/description characters and body words programmatically. Check
   dates, keyword/section counts, image source, and alt text.
3. Review overlap by customer intent as well as slug. Ensure the example,
   checklist, evidence, and limits add something useful beyond existing posts.
4. Verify the hero, single H1, H2s, related links, and CTA in the rendered page when
   preview is available. Otherwise inspect consumers and report visual/live
   verification as unperformed. Do not claim the page is indexed.
5. Run `npx tsc --noEmit`, `npx eslint src/features/content/blog/blog-registry.ts`,
   and `git diff --check`. Add targeted checks for other changed files. Report
   existing failures separately; do not change unrelated code to make checks pass.
6. Report title, public URL path, measured lengths, evidence, nearest-overlap
   distinction, checks, and limitations. Say "added locally; ready after deployment"
   until public deployment is verified. Search engines decide indexing/ranking.
7. Update automation memory when permitted with run time, topic decision, sources,
   metric filters or unavailable-data note, new slug, checks, and next review.
   If memory is outside writable roots, leave a repository handoff and report the
   synchronization limitation; do not bypass permission boundaries.

At a weekly review, use consistent reporting windows and compare discovery with
meaningful customer actions. Recommend an existing-page improvement when it
already answers the query. Refreshes/consolidations need separate authorization
and preserved URLs; do not delete pages or add tracking during a content-only run.
Use findings to select the next brief, retaining uncertainty for small samples.

## Reference guidance

- [Google: helpful content and word count](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google: supported meta tags](https://developers.google.com/search/docs/crawling-indexing/special-tags)
- [Google: HowTo and FAQ changes](https://developers.google.com/search/blog/2023/08/howto-faq-changes)

Recheck relevant platform guidance during research. Do not describe a dated
template as an immutable list of Google's ranking rules.
