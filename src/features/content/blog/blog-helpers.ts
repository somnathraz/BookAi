import type { BlogArticle } from "@/features/content/blog/blog-registry";
import {
  blogArticleModifiedAt,
  blogRegistry,
} from "@/features/content/blog/blog-registry";

/** List/card fields only — never ship full article sections to client trees. */
export type BlogArticleSummary = Pick<
  BlogArticle,
  | "slug"
  | "title"
  | "description"
  | "category"
  | "publishedAt"
  | "updatedAt"
  | "readingMinutes"
  | "image"
  | "imageAlt"
>;

export function toBlogSummary(article: BlogArticle): BlogArticleSummary {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    category: article.category,
    publishedAt: article.publishedAt,
    updatedAt: blogArticleModifiedAt(article),
    readingMinutes: article.readingMinutes,
    // List cards do not need 1800px heroes; smaller assets crawl and load faster.
    image: article.image.replace(/([?&])w=\d+/i, "$1w=960"),
    imageAlt: article.imageAlt,
  };
}

export function displayBlogDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function blogCategorySlug(category: string): string {
  return category
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function listBlogCategories(): { name: string; slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const article of blogRegistry) {
    counts.set(article.category, (counts.get(article.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: blogCategorySlug(name), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getBlogCategoryBySlug(
  slug: string
): { name: string; slug: string; articles: BlogArticle[] } | null {
  const categories = listBlogCategories();
  const match = categories.find((category) => category.slug === slug);
  if (!match) return null;
  const articles = blogRegistry.filter((article) => article.category === match.name);
  return { name: match.name, slug: match.slug, articles };
}

/** Unique posts by slug (first occurrence wins) for sitemap / RSS. */
export function listUniqueBlogArticles(): BlogArticle[] {
  const seen = new Set<string>();
  const unique: BlogArticle[] = [];
  for (const article of blogRegistry) {
    if (seen.has(article.slug)) continue;
    seen.add(article.slug);
    unique.push(article);
  }
  return unique;
}

export function getRelatedBlogArticles(
  article: BlogArticle,
  limit = 3
): BlogArticle[] {
  const sameCategory = blogRegistry.filter(
    (candidate) =>
      candidate.slug !== article.slug && candidate.category === article.category
  );
  const others = blogRegistry.filter(
    (candidate) =>
      candidate.slug !== article.slug && candidate.category !== article.category
  );
  return [...sameCategory, ...others].slice(0, limit);
}

export function recentBlogArticles(limit = 4): BlogArticleSummary[] {
  return listUniqueBlogArticles().slice(0, limit).map(toBlogSummary);
}

export const BLOG_INDEX_PAGE_SIZE = 12;

export function paginateBlogSummaries(
  page = 1,
  pageSize = BLOG_INDEX_PAGE_SIZE
): {
  featured: BlogArticleSummary | null;
  articles: BlogArticleSummary[];
  page: number;
  totalPages: number;
  total: number;
} {
  const all = listUniqueBlogArticles().map(toBlogSummary);
  const featured = all[0] ?? null;
  const rest = all.slice(1);
  const totalPages = Math.max(1, Math.ceil(rest.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    featured: safePage === 1 ? featured : null,
    articles: rest.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total: all.length,
  };
}
