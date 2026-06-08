import type { Metadata } from "next";

import { Studio } from "@/components/generator/Studio";
import { PaperChaiJsonLd } from "@/components/marketing/PaperChaiJsonLd";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

export default function Home() {
  return (
    <>
      <PaperChaiJsonLd />
      <Studio />
    </>
  );
}
