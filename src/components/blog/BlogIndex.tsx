import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock3 } from "lucide-react";

import type { BlogArticleSummary } from "@/features/content/blog/blog-helpers";
import {
  blogCategorySlug,
  displayBlogDate,
} from "@/features/content/blog/blog-helpers";

/**
 * Server-rendered journal index.
 * Keep this free of client motion/state so crawlers get full HTML without a
 * heavy RSC payload of every article body.
 */
export function BlogIndex({
  featured,
  articles,
  categories = [],
  page = 1,
  totalPages = 1,
}: {
  featured: BlogArticleSummary | null;
  articles: readonly BlogArticleSummary[];
  categories?: readonly { name: string; slug: string; count: number }[];
  page?: number;
  totalPages?: number;
}) {
  if (!featured && articles.length === 0) return null;

  return (
    <main className="overflow-hidden bg-background">
      {featured ? (
        <section className="relative isolate min-h-[min(760px,calc(100svh-4rem))] overflow-hidden bg-[#0d1511] text-white">
          <Image
            src={featured.image}
            alt={featured.imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,15,10,0.96)_0%,rgba(7,15,10,0.8)_45%,rgba(7,15,10,0.18)_100%)]" />
          <div className="relative mx-auto flex min-h-[min(760px,calc(100svh-4rem))] max-w-6xl items-end px-6 pb-14 pt-28 sm:pb-20">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                PaperChai journal · {featured.category}
              </p>
              <h1 className="mt-5 font-[family-name:var(--font-editorial)] text-5xl leading-[0.96] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
                {featured.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
                {featured.description}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-white/65">
                <time dateTime={featured.publishedAt}>
                  {displayBlogDate(featured.publishedAt)}
                </time>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3.5" />
                  {featured.readingMinutes} min read
                </span>
              </div>
              <Link
                href={`/blog/${featured.slug}`}
                className="mt-9 inline-flex items-center gap-2 border-b border-emerald-200 pb-2 text-sm font-semibold text-emerald-100 transition hover:gap-3"
              >
                Read the guide <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <header className="mx-auto max-w-6xl px-6 pb-8 pt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">
            PaperChai journal
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-editorial)] text-5xl tracking-[-0.035em]">
            Guides for local businesses
          </h1>
        </header>
      )}

      {categories.length ? (
        <section className="border-b border-border">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-6 py-5">
            <span className="self-center text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Topics
            </span>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/blog/category/${category.slug}`}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-emerald-700/40 hover:text-foreground"
              >
                {category.name}
                <span className="ml-1.5 text-muted-foreground/70">
                  {category.count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="flex items-end justify-between gap-5 border-b border-border pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Useful before you publish
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-editorial)] text-4xl tracking-[-0.03em] sm:text-5xl">
              Built for the next practical decision.
            </h2>
          </div>
        </div>
        <div className="divide-y divide-border">
          {articles.map((article) => (
            <article
              key={article.slug}
              className="grid gap-7 py-9 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300">
                  <Link
                    href={`/blog/category/${blogCategorySlug(article.category)}`}
                    className="transition hover:underline"
                  >
                    {article.category}
                  </Link>
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-editorial)] text-3xl leading-tight tracking-[-0.025em] sm:text-4xl">
                  <Link
                    href={`/blog/${article.slug}`}
                    className="transition hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    {article.title}
                  </Link>
                </h3>
                <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                  {article.description}
                </p>
                <p className="mt-5 text-sm text-muted-foreground">
                  <time dateTime={article.publishedAt}>
                    {displayBlogDate(article.publishedAt)}
                  </time>
                  {" · "}
                  {article.readingMinutes} min read
                </p>
              </div>
              <Link
                href={`/blog/${article.slug}`}
                className="group relative block aspect-[4/3] overflow-hidden bg-muted"
              >
                <Image
                  src={article.image}
                  alt={article.imageAlt}
                  fill
                  sizes="(min-width: 640px) 220px, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
              </Link>
            </article>
          ))}
        </div>

        {totalPages > 1 ? (
          <nav
            aria-label="Journal pages"
            className="mt-12 flex items-center justify-between border-t border-border pt-6 text-sm"
          >
            {page > 1 ? (
              <Link
                href={page === 2 ? "/blog" : `/blog/page/${page - 1}`}
                className="font-semibold text-emerald-800 dark:text-emerald-300"
              >
                ← Newer guides
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/blog/page/${page + 1}`}
                className="font-semibold text-emerald-800 dark:text-emerald-300"
              >
                Older guides →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </section>
    </main>
  );
}
