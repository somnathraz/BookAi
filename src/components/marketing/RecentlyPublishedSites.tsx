"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import type { PublicSiteCard } from "@/lib/public-sites";
import { apiClient } from "@/platform/api/api-client";

const EASE = [0.22, 1, 0.36, 1] as const;

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function SiteTile({ site, index }: { site: PublicSiteCard; index: number }) {
  const reduceMotion = useReducedMotion();
  const external = isExternalHref(site.href);
  const content = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-[#dce8e2] dark:bg-[#1a1d1a]">
        {site.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- proxied / third-party gallery URLs
          <img
            src={site.photoUrl}
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading={index < 4 ? "eager" : "lazy"}
          />
        ) : (
          <div className="flex size-full items-end bg-gradient-to-br from-[#214f43] via-[#173b32] to-[#11130f] p-4">
            <span className="text-2xl font-semibold tracking-tight text-white/90">
              {site.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 border-t border-stone-900/10 pt-4 dark:border-white/10">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-950 dark:text-stone-50">
            {site.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-stone-500 dark:text-stone-400">
            {site.domainLabel}
            {site.tagline ? ` · ${site.tagline}` : ""}
          </p>
        </div>
        <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-[#214f43] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-[#9cc2b3]" />
      </div>
    </>
  );

  const className =
    "group block min-w-[15.5rem] snap-start outline-none transition focus-visible:ring-2 focus-visible:ring-[#214f43]/50 sm:min-w-0";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: EASE }}
    >
      {external ? (
        <a
          href={site.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {content}
        </a>
      ) : (
        <Link href={site.href} className={className}>
          {content}
        </Link>
      )}
    </motion.div>
  );
}

/**
 * Homepage gallery of recently published PaperChai sites.
 * Accepts server-fetched sites; falls back to a client fetch when empty.
 */
export function RecentlyPublishedSites({
  initialSites = [],
}: {
  initialSites?: PublicSiteCard[];
}) {
  const reduceMotion = useReducedMotion();
  const [sites, setSites] = useState(initialSites);

  useEffect(() => {
    setSites(initialSites);
  }, [initialSites]);

  useEffect(() => {
    if (initialSites.length > 0) return;
    let cancelled = false;
    void apiClient
      .get<{ sites: PublicSiteCard[] }>("/api/sites/recent?limit=8")
      .then((data) => {
        if (!cancelled) setSites(data.sites ?? []);
      })
      .catch(() => {
        /* Section stays hidden when the list is unavailable. */
      });
    return () => {
      cancelled = true;
    };
  }, [initialSites.length]);

  if (!sites.length) return null;

  return (
    <section className="mx-auto mt-28 max-w-6xl px-5 sm:px-6">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, ease: EASE }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#214f43] dark:text-[#9cc2b3]">
            Recently published
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-stone-950 dark:text-stone-50 sm:text-5xl">
            Live sites from PaperChai
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-stone-500 dark:text-stone-400">
          Real businesses and professionals who went live — open any site to see
          what your page can look like.
        </p>
      </motion.div>

      <div className="mt-12 -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {sites.map((site, index) => (
          <SiteTile key={site.slug} site={site} index={index} />
        ))}
      </div>
    </section>
  );
}
