# PaperChai editorial pipeline audit

Observed 2026-10-06. Scope: the local repository, public search discovery, and
accessible public pages. This pipeline update adds no new article and preserves
earlier entries and all existing user changes.

## Measured findings

The current working tree contains 54 articles and no duplicate slugs. These counts
include uncommitted work; they do not represent deployed content or indexing.

| Slug family | Articles |
| --- | ---: |
| Google Business Profile / Maps / reviews | 25 |
| Booking / appointments | 9 |
| WhatsApp | 5 |
| Service area | 4 |
| Search Console / indexing | 4 |
| FAQ | 2 |

Families overlap. Several booking-link, WhatsApp enquiry-link, service-area, and
FAQ posts answer closely related questions. This supports a stronger intent-based
selection gate, not a claim of a ranking penalty or permission to delete URLs.

51 titles exceed the 60-character house target; 22 descriptions fall outside
140–160 characters. Only one article explicitly has updatedAt; the helper falls
back to publishedAt for older posts. These are editorial differences, not evidence
of indexing failure. No old copy or dates were mass-edited. Google does not impose
our exact title lengths and says there is no preferred word count.

Two local entries already have a 2026-10-06 publish date. Their bodies contain
1,050 and 1,012 words using whitespace counting. They were written under the
previous brief. Apply the new 1,200-word full-guide minimum prospectively; do not
pad or backdate them. The scheduled workflow should skip a day with an existing post.

## Publishing capabilities and gaps

Source inspection confirms:

- The article route renders one H1, H2 sections, a hero with alt text, related
  guides, and a /?new site-creation CTA.
- Metadata includes a canonical URL, index/follow directives, Open Graph article
  dates, and registry-derived BlogPosting and BreadcrumbList data.
- Sitemap and RSS consume the registry. Sitemap modification dates use the
  updatedAt fallback. A separate sitemap or MDX directory is unnecessary.
- Paragraphs are plain text: raw Markdown links do not become anchors. Related
  guides are selected by category then order; each run must check relevance.
- No explicit public /contact page or SomSite services exist in the route inventory.
- GA4 page-view and sign-up/site-creation/purchase helpers exist. No dedicated
  blog-CTA event was found in the inspected blog files. Actual collection and
  attribution were not verified; no tracking settings were changed.

The public homepage was retrievable through web research. Search returned article
URLs including service-menu and portfolio workflow guides. Direct blog, article,
robots, and sitemap fetches failed in this research session; shell networking also
failed DNS resolution. These access failures do not establish the live site's HTTP
status, robots behavior, or indexing eligibility. Source checks are not live checks.

No authenticated Search Console, GA4, or social-account report was available through
the inspected tools. This audit cannot identify the highest-traffic, highest-converting,
or viral post. Search result presence is not a traffic report.

## Next research candidates

These are hypotheses, not verified high-volume keywords or publication approvals.
Recheck sources, demand, and the full registry before drafting.

| Customer task | Evidence and distinction | Decision |
| --- | --- | --- |
| Choose English, Hindi, or both for a local service website | Meta's 2026 update describes additional Indian-language Reel translations. This supports a timely language discussion, not measured website demand. Focus on service-page wording and supported contact language, distinct from the Reel proof guide. | First candidate to investigate. |
| Review an AI-generated service page before publishing | Google's guidance discusses useful original AI-assisted content. A worked check of invented prices, coverage, and qualifications could help. Compare closely with existing launch/review guides. | Candidate only with a materially new worked example. |
| Evaluate an offer to make a local website appear in AI search | Google's AI-search guidance is relevant, but the article could repeat existing schema/indexing advice or attract broad SEO traffic. | Lower priority; require a narrow buyer decision. |

Avoid another transformation Reel article immediately: the newest local entry
already covers that job. No inspected individual social post supplied a defensible
baseline for calling a format viral. Use useful hooks, evidence, worked examples,
and checklists without copying another post or promising reach.

## Feedback loop

When authorized reports are available, compare complete 28-day windows with
consistent India/device/channel filters. Pair query/page discovery metrics with
measured actions such as site creation. Mark small samples and missing attribution.
Propose a separate refresh when a query already has a suitable article. Impressions
or broad social views alone should not decide what to publish next.

## References

- [PaperChai homepage](https://paperchaiapp.com/)
- [Service-menu article found in public search](https://paperchaiapp.com/blog/service-menu-local-business-website-india)
- [Google: people-first content and word count](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google: supported meta tags](https://developers.google.com/search/docs/crawling-indexing/special-tags)
- [Google: AI-assisted content](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)
- [Google: AI-search resource announcement](https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing)
- [Meta: Indian-language Reel translation update](https://about.fb.com/news/2025/11/instagram-empowers-creators-to-go-global-with-local-voice-translations-and-fonts/amp/)

## Run handoff

Audit observation time: 2026-10-06T12:56:20Z.

Updated the reusable CODEX_BLOG_PROMPT.md with adapted article structure, evidence
and uniqueness gates, the prospective 1,200–1,600-word guide brief, actual rendered
link checks, image inspection, analytics limitations, a daily duplicate guard, and
verification/reporting rules. Prepared the scheduler replacement in
docs/BLOG-AUTOMATION-PROMPT.md. No new article or runtime change in this turn.

The automation tool returned: "MCP tool call requires approval, but approval policy
is never". The saved job still has its previous prompt. Its directory and memory
file are outside this session's writable roots, so they were not edited through
a filesystem workaround. This repository handoff preserves decisions until the
existing automation can be updated and its memory synchronized.

Verification completed: TypeScript (`npx tsc --noEmit`), targeted ESLint for the
registry/helpers/JSON-LD, and `git diff --check` passed. The working-tree status at
handoff contains only the reusable prompt change and the two new audit/handoff
documents. Applying the prepared prompt with automation_update was attempted and
received the same approval-policy rejection; the scheduled job is not updated.

Run handoff time: 2026-10-06 13:01:40 UTC.
