import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { BlogArticleSummary } from "@/features/content/blog/blog-helpers";
import { displayBlogDate } from "@/features/content/blog/blog-helpers";

/** Homepage teaser linking into the journal for crawl + discovery. */
export function RecentJournal({
  articles,
}: {
  articles: readonly BlogArticleSummary[];
}) {
  if (!articles.length) return null;

  return (
    <section className="mx-auto mt-28 max-w-6xl px-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#214f43] dark:text-[#9cc2b3]">
            From the journal
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-stone-950 dark:text-stone-50 sm:text-5xl">
            Practical guides for local businesses
          </h2>
        </div>
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#214f43] transition hover:text-[#173b32] dark:text-[#9cc2b3]"
        >
          View all guides
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-12 grid gap-8 border-t border-stone-900/10 pt-8 dark:border-white/10 md:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="group block min-w-0"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#214f43] dark:text-[#9cc2b3]">
              {article.category}
            </p>
            <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-stone-950 transition group-hover:text-[#214f43] dark:text-stone-50 dark:group-hover:text-[#9cc2b3]">
              {article.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-500 dark:text-stone-400">
              {article.description}
            </p>
            <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
              <time dateTime={article.publishedAt}>
                {displayBlogDate(article.publishedAt)}
              </time>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
