import type { Metadata } from "next";

import { BlogIndex } from "@/components/blog/BlogIndex";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { blogRegistry } from "@/features/content/blog/blog-registry";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Journal for local businesses and independent work",
  description: "Practical guides for creating a clearer website, getting more enquiries, and sharing your work with confidence.",
  path: "/blog",
});

export default function BlogPage() {
  return <><MarketingNav /><BlogIndex articles={blogRegistry} /><MarketingFooter /></>;
}
