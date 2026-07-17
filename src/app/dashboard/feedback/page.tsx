import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { FeedbackPageContent } from "@/components/feedback/FeedbackPageContent";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Feedback",
  description: "Rate PaperChai and tell us which features you want next.",
  path: "/dashboard/feedback",
  noIndex: true,
});

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </main>
      }
    >
      <FeedbackPageContent />
    </Suspense>
  );
}
