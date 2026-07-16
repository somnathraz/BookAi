import type { Metadata } from "next";

import { DraftSitePreview } from "@/components/generator/DraftSitePreview";

export const metadata: Metadata = {
  title: "Website preview",
  robots: { index: false, follow: false },
};

export default function DraftPreviewPage() {
  return <DraftSitePreview />;
}
