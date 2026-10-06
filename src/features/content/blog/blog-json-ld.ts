import type { BlogArticle } from "@/features/content/blog/blog-registry";
import { blogArticleModifiedAt } from "@/features/content/blog/blog-registry";
import { PRODUCT_NAME } from "@/lib/brand";
import { absoluteUrl } from "@/lib/seo";

export function blogPostingJsonLd(article: BlogArticle) {
  const url = absoluteUrl(`/blog/${article.slug}`);
  const modified = blogArticleModifiedAt(article);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    image: [
      {
        "@type": "ImageObject",
        url: article.image,
        caption: article.imageAlt,
      },
    ],
    datePublished: article.publishedAt,
    dateModified: modified,
    author: {
      "@type": "Organization",
      name: PRODUCT_NAME,
      url: absoluteUrl("/"),
    },
    publisher: {
      "@type": "Organization",
      name: PRODUCT_NAME,
      url: absoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.png"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    url,
    keywords: article.keywords.join(", "),
    articleSection: article.category,
    timeRequired: `PT${article.readingMinutes}M`,
    inLanguage: "en-IN",
  };
}

export function blogIndexJsonLd(articles: readonly BlogArticle[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PaperChai journal",
    description:
      "Practical guides for creating a clearer website, getting more enquiries, and sharing your work with confidence.",
    url: absoluteUrl("/blog"),
    isPartOf: {
      "@type": "WebSite",
      name: PRODUCT_NAME,
      url: absoluteUrl("/"),
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.slice(0, 20).map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/blog/${article.slug}`),
        name: article.title,
      })),
    },
  };
}

export function blogBreadcrumbJsonLd(
  crumbs: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}
