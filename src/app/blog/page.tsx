import type { Metadata } from "next";

import { BlogIndex } from "@/components/blog/BlogIndex";
import { BlogJsonLd } from "@/components/blog/BlogJsonLd";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import {
  listBlogCategories,
  listUniqueBlogArticles,
  paginateBlogSummaries,
} from "@/features/content/blog/blog-helpers";
import { blogIndexJsonLd } from "@/features/content/blog/blog-json-ld";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "Journal for local businesses and independent work",
  description:
    "Practical guides for creating a clearer website, getting more enquiries, and sharing your work with confidence.",
  path: "/blog",
  keywords: [
    "local business website India",
    "Google Business Profile website guide",
    "small business website tips India",
    "PaperChai journal",
  ],
  alternatesTypes: {
    "application/rss+xml": absoluteUrl("/blog/rss.xml"),
  },
});

export default function BlogPage() {
  const { featured, articles, page, totalPages } = paginateBlogSummaries(1);
  const categories = listBlogCategories();

  return (
    <>
      <BlogJsonLd data={blogIndexJsonLd(listUniqueBlogArticles())} />
      <MarketingNav />
      <BlogIndex
        featured={featured}
        articles={articles}
        categories={categories}
        page={page}
        totalPages={totalPages}
      />
      <MarketingFooter />
    </>
  );
}
