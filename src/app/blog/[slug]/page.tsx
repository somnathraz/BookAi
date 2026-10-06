import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";

import { BlogJsonLd } from "@/components/blog/BlogJsonLd";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import {
  blogCategorySlug,
  displayBlogDate,
  getRelatedBlogArticles,
} from "@/features/content/blog/blog-helpers";
import {
  blogBreadcrumbJsonLd,
  blogPostingJsonLd,
} from "@/features/content/blog/blog-json-ld";
import {
  blogArticleModifiedAt,
  blogRegistry,
  getBlogArticle,
} from "@/features/content/blog/blog-registry";
import { articleMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export function generateStaticParams() {
  const seen = new Set<string>();
  return blogRegistry
    .filter((article) => {
      if (seen.has(article.slug)) return false;
      seen.add(article.slug);
      return true;
    })
    .map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getBlogArticle(slug);
  if (!article) return {};
  return articleMetadata({
    title: article.title,
    description: article.description,
    path: `/blog/${article.slug}`,
    ogImage: article.image,
    keywords: article.keywords,
    publishedAt: article.publishedAt,
    modifiedAt: blogArticleModifiedAt(article),
    section: article.category,
  });
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const article = getBlogArticle((await params).slug);
  if (!article) notFound();

  const related = getRelatedBlogArticles(article, 3);
  const categoryPath = `/blog/category/${blogCategorySlug(article.category)}`;

  return (
    <>
      <BlogJsonLd
        data={[
          blogPostingJsonLd(article),
          blogBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Journal", path: "/blog" },
            { name: article.category, path: categoryPath },
            { name: article.title, path: `/blog/${article.slug}` },
          ]),
        ]}
      />
      <MarketingNav />
      <main>
        <header className="mx-auto max-w-4xl px-6 pb-12 pt-16 sm:pb-16 sm:pt-24">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            All guides
          </Link>
          <p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">
            <Link href={categoryPath} className="transition hover:underline">
              {article.category}
            </Link>
          </p>
          <h1 className="mt-5 font-[family-name:var(--font-editorial)] text-5xl leading-[0.98] tracking-[-0.035em] sm:text-6xl">
            {article.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            {article.description}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <time dateTime={article.publishedAt}>
              {displayBlogDate(article.publishedAt)}
            </time>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              {article.readingMinutes} min read
            </span>
            <span>By PaperChai</span>
          </div>
        </header>
        <figure className="relative mx-auto aspect-[16/8] max-w-6xl overflow-hidden px-6">
          <Image
            src={article.image}
            alt={article.imageAlt}
            fill
            priority
            sizes="(min-width: 1200px) 1152px, 100vw"
            className="object-cover"
          />
        </figure>
        <article className="mx-auto max-w-2xl px-6 py-16 text-[1.05rem] leading-8 sm:py-24">
          {article.sections.map((section) => (
            <section key={section.heading} className="mt-12 first:mt-0">
              <h2 className="font-[family-name:var(--font-editorial)] text-3xl leading-tight tracking-[-0.025em] sm:text-4xl">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-5 text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          {related.length ? (
            <aside className="mt-16 border-t border-border pt-10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Keep reading
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-editorial)] text-3xl tracking-[-0.025em]">
                Related guides
              </h2>
              <ul className="mt-6 space-y-4">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/blog/${item.slug}`}
                      className="group block rounded-xl border border-border/70 px-4 py-3 transition hover:border-emerald-700/40"
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-300">
                        {item.category}
                      </span>
                      <span className="mt-1 block font-semibold text-foreground transition group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                        {item.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}

          <div className="mt-16 border-y border-border py-8">
            <p className="font-[family-name:var(--font-editorial)] text-2xl">
              Ready to make your own page clearer?
            </p>
            <Link
              href="/?new"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-700 dark:text-emerald-300"
            >
              Create a site with PaperChai
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </article>
      </main>
      <MarketingFooter />
    </>
  );
}
