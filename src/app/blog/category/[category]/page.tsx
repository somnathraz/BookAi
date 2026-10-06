import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogJsonLd } from "@/components/blog/BlogJsonLd";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import {
  displayBlogDate,
  getBlogCategoryBySlug,
  listBlogCategories,
  toBlogSummary,
} from "@/features/content/blog/blog-helpers";
import { blogBreadcrumbJsonLd } from "@/features/content/blog/blog-json-ld";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export function generateStaticParams() {
  return listBlogCategories().map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getBlogCategoryBySlug(slug);
  if (!category) return {};
  return pageMetadata({
    title: `${category.name} guides for local businesses`,
    description: `Practical ${category.name.toLowerCase()} guides for Indian local businesses and independent professionals building a clearer website.`,
    path: `/blog/category/${category.slug}`,
    keywords: [
      `${category.name} website India`,
      "local business website guides",
      "PaperChai journal",
    ],
  });
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const category = getBlogCategoryBySlug((await params).category);
  if (!category) notFound();
  const articles = category.articles.map(toBlogSummary);

  return (
    <>
      <BlogJsonLd
        data={blogBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/blog" },
          { name: category.name, path: `/blog/category/${category.slug}` },
        ])}
      />
      <MarketingNav />
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-16 sm:pt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">
          Topic
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-editorial)] text-5xl tracking-[-0.035em]">
          {category.name}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          {articles.length} practical guides for clearer websites, enquiries,
          and local growth.
        </p>
        <ul className="mt-12 divide-y divide-border border-y border-border">
          {articles.map((article) => (
            <li key={article.slug} className="py-7">
              <Link
                href={`/blog/${article.slug}`}
                className="group block transition"
              >
                <h2 className="font-[family-name:var(--font-editorial)] text-2xl tracking-[-0.02em] transition group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                  {article.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {article.description}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  <time dateTime={article.publishedAt}>
                    {displayBlogDate(article.publishedAt)}
                  </time>
                  {" · "}
                  {article.readingMinutes} min read
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/blog"
          className="mt-10 inline-block text-sm font-semibold text-emerald-800 dark:text-emerald-300"
        >
          ← All journal guides
        </Link>
      </main>
      <MarketingFooter />
    </>
  );
}
