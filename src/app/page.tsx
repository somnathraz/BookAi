import type { Metadata } from "next";

import { Studio } from "@/components/generator/Studio";
import { PaperChaiJsonLd } from "@/components/marketing/PaperChaiJsonLd";
import { listRecentPublicSites } from "@/features/site-management/application/list-recent-public-sites";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

export default async function Home() {
  let recentSites: Awaited<ReturnType<typeof listRecentPublicSites>> = [];
  try {
    recentSites = await listRecentPublicSites(8);
  } catch {
    recentSites = [];
  }

  return (
    <>
      <PaperChaiJsonLd />
      <Studio recentSites={recentSites} />
    </>
  );
}
