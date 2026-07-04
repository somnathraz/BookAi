import type { Metadata } from "next";

import { Studio } from "@/components/generator/Studio";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Edit site",
  description: "Update your published PaperChai site and republish to the same URL.",
  path: "/edit",
  noIndex: true,
});

export default async function EditSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Studio editSiteId={id} />;
}
