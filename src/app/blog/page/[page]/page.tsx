import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogIndex } from "@/components/blog/BlogIndex";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import {
  BLOG_INDEX_PAGE_SIZE,
  listBlogCategories,
  listUniqueBlogArticles,
  paginateBlogSummaries,
} from "@/features/content/blog/blog-helpers";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export function generateStaticParams() {
  const rest = Math.max(0, listUniqueBlogArticles().length - 1);
  const totalPages = Math.max(1, Math.ceil(rest / BLOG_INDEX_PAGE_SIZE));
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({
    page: String(index + 2),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const pageNum = Number.parseInt((await params).page, 10);
  if (!Number.isFinite(pageNum) || pageNum < 2) return {};
  return pageMetadata({
    title: `Journal for local businesses — page ${pageNum}`,
    description:
      "Older practical guides for creating a clearer website, getting more enquiries, and sharing your work with confidence.",
    path: `/blog/page/${pageNum}`,
  });
}

export default async function BlogPagedIndex({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const pageNum = Number.parseInt((await params).page, 10);
  if (!Number.isFinite(pageNum) || pageNum < 2) notFound();

  const { featured, articles, page, totalPages } = paginateBlogSummaries(pageNum);
  if (page !== pageNum || articles.length === 0) notFound();

  return (
    <>
      <MarketingNav />
      <BlogIndex
        featured={featured}
        articles={articles}
        categories={listBlogCategories()}
        page={page}
        totalPages={totalPages}
      />
      <MarketingFooter />
    </>
  );
}
