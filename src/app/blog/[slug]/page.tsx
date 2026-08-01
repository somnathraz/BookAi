import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";

import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { blogRegistry, getBlogArticle } from "@/features/content/blog/blog-registry";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() { return blogRegistry.map(({ slug }) => ({ slug })); }

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const article = getBlogArticle(slug);
    if (!article) return {};
    return pageMetadata({ title: article.title, description: article.description, path: `/blog/${article.slug}`, ogImage: article.image });
  });
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = getBlogArticle((await params).slug);
  if (!article) notFound();
  return (
    <><MarketingNav />
      <main>
        <header className="mx-auto max-w-4xl px-6 pb-12 pt-16 sm:pb-16 sm:pt-24">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" />All guides</Link>
          <p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">{article.category}</p>
          <h1 className="mt-5 font-[family-name:var(--font-editorial)] text-5xl leading-[0.98] tracking-[-0.035em] sm:text-6xl">{article.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{article.description}</p>
          <div className="mt-7 flex items-center gap-4 text-sm text-muted-foreground"><span>{article.publishedAt}</span><span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{article.readingMinutes} min read</span></div>
        </header>
        <figure className="relative mx-auto aspect-[16/8] max-w-6xl overflow-hidden px-6"><Image src={article.image} alt={article.imageAlt} fill priority sizes="(min-width: 1200px) 1152px, 100vw" className="object-cover" /></figure>
        <article className="mx-auto max-w-2xl px-6 py-16 text-[1.05rem] leading-8 sm:py-24">
          {article.sections.map((section) => <section key={section.heading} className="mt-12 first:mt-0"><h2 className="font-[family-name:var(--font-editorial)] text-3xl leading-tight tracking-[-0.025em] sm:text-4xl">{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-5 text-muted-foreground">{paragraph}</p>)}</section>)}
          <div className="mt-16 border-y border-border py-8"><p className="font-[family-name:var(--font-editorial)] text-2xl">Ready to make your own page clearer?</p><Link href="/?new" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-700 dark:text-emerald-300">Create a site with PaperChai <ArrowRight className="size-4" /></Link></div>
        </article>
      </main><MarketingFooter />
    </>
  );
}
