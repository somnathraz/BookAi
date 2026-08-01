"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock3 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import type { BlogArticle } from "@/features/content/blog/blog-registry";

function displayDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function BlogIndex({ articles }: { articles: readonly BlogArticle[] }) {
  const reduceMotion = useReducedMotion();
  const [featured, ...rest] = articles;
  if (!featured) return null;

  return (
    <main className="overflow-hidden bg-background">
      <section className="relative isolate min-h-[min(760px,calc(100svh-4rem))] overflow-hidden bg-[#0d1511] text-white">
        <Image
          src={featured.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,15,10,0.96)_0%,rgba(7,15,10,0.8)_45%,rgba(7,15,10,0.18)_100%)]" />
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto flex min-h-[min(760px,calc(100svh-4rem))] max-w-6xl items-end px-6 pb-14 pt-28 sm:pb-20"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              PaperChai journal · {featured.category}
            </p>
            <h1 className="mt-5 font-[family-name:var(--font-editorial)] text-5xl leading-[0.96] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
              {featured.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">{featured.description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-white/65">
              <span>{displayDate(featured.publishedAt)}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{featured.readingMinutes} min read</span>
            </div>
            <Link href={`/blog/${featured.slug}`} className="mt-9 inline-flex items-center gap-2 border-b border-emerald-200 pb-2 text-sm font-semibold text-emerald-100 transition hover:gap-3">
              Read the guide <ArrowRight className="size-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="flex items-end justify-between gap-5 border-b border-border pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Useful before you publish</p>
            <h2 className="mt-2 font-[family-name:var(--font-editorial)] text-4xl tracking-[-0.03em] sm:text-5xl">Built for the next practical decision.</h2>
          </div>
        </div>
        <div className="divide-y divide-border">
          {rest.map((article, index) => (
            <motion.article
              key={article.slug}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              className="grid gap-7 py-9 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300">{article.category}</p>
                <h3 className="mt-3 font-[family-name:var(--font-editorial)] text-3xl leading-tight tracking-[-0.025em] sm:text-4xl">
                  <Link href={`/blog/${article.slug}`} className="transition hover:text-emerald-700 dark:hover:text-emerald-300">{article.title}</Link>
                </h3>
                <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{article.description}</p>
                <p className="mt-5 text-sm text-muted-foreground">{displayDate(article.publishedAt)} · {article.readingMinutes} min read</p>
              </div>
              <Link href={`/blog/${article.slug}`} className="group relative block aspect-[4/3] overflow-hidden bg-muted">
                <Image src={article.image} alt={article.imageAlt} fill sizes="(min-width: 640px) 220px, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
              </Link>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  );
}
