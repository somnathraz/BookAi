"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/platform/api/api-client";

const EASE = [0.22, 1, 0.36, 1] as const;

const NEXT_STEPS = [
  {
    icon: Globe,
    title: "Share your live link",
    body: "Send it to customers on WhatsApp, Google, or your storefront.",
  },
  {
    icon: LayoutDashboard,
    title: "Open My sites",
    body: "Edit copy, photos, theme, and booking anytime from your dashboard.",
  },
  {
    icon: Sparkles,
    title: "Connect your domain",
    body: "In site settings, add DNS records for your own .com or .in address.",
  },
] as const;

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Okay",
  3: "Good",
  4: "Great",
  5: "Excellent",
};

export function PublishSuccess({
  siteId,
  siteName,
  liveUrl,
  settingsUrl,
  onViewSite,
}: {
  siteId: string;
  siteName: string;
  liveUrl: string;
  settingsUrl: string;
  onViewSite: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitFeedback() {
    if (!rating || saving || submitted) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient.post("/api/feedback", {
        body: {
          siteId,
          rating,
          experience: comment.trim() || undefined,
        },
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send feedback.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: EASE }}
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-[1.5rem] border border-[#11130f]/10 bg-white/85 px-5 py-8 shadow-[0_30px_80px_-55px_rgba(17,19,15,0.5)] dark:border-white/10 dark:bg-[#151815]/90 sm:px-8 sm:py-10"
    >
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#dce8e2] dark:bg-[#214f43]/25">
          <CheckCircle2 className="size-7 text-[#214f43] dark:text-[#9cc2b3]" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#214f43] dark:text-[#9cc2b3]">
          Site published
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#11130f] dark:text-stone-50 sm:text-3xl">
          {siteName} is live
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Quick ask before you go — how was building this site?
        </p>
        <a
          href={liveUrl}
          className="mt-3 inline-block break-all text-sm font-medium text-[#214f43] underline-offset-4 hover:underline dark:text-[#9cc2b3]"
        >
          {liveUrl}
        </a>
      </div>

      <div className="rounded-2xl border border-[#214f43]/20 bg-[#dce8e2]/45 p-5 dark:border-[#9cc2b3]/25 dark:bg-[#214f43]/15 sm:p-6">
        <p className="text-center text-base font-semibold text-[#11130f] dark:text-stone-50">
          We&apos;d love your feedback
        </p>
        <p className="mx-auto mt-1 max-w-sm text-center text-sm leading-6 text-[#3d4f48] dark:text-stone-300">
          Rate your experience. One tap helps us improve PaperChai for the next business.
        </p>

        {!submitted ? (
          <>
            <div className="mt-5 flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onMouseEnter={() => setHover(value)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(value)}
                  className="rounded-lg p-1.5 transition"
                  aria-label={`Rate ${value} out of 5`}
                >
                  <Star
                    className={cn(
                      "size-9 transition sm:size-10",
                      (hover || rating) >= value
                        ? "fill-[#d8ba70] text-[#d8ba70]"
                        : "text-stone-300 dark:text-stone-600"
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 ? (
              <p className="mt-2 text-center text-sm font-medium text-[#214f43] dark:text-[#9cc2b3]">
                {RATING_LABELS[rating]}
              </p>
            ) : null}

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What worked? What was confusing? (optional)"
              rows={3}
              className="mt-4 w-full resize-none rounded-xl border border-[#11130f]/10 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#214f43]/40 dark:border-white/10 dark:bg-[#0d0f0d] dark:text-stone-100"
            />

            {error ? (
              <p className="mt-2 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}

            <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <Button
                type="button"
                disabled={!rating || saving}
                onClick={() => void submitFeedback()}
                className="w-full rounded-full bg-[#214f43] hover:bg-[#1a3f36] sm:w-auto"
              >
                {saving ? "Sending…" : "Send feedback"}
              </Button>
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link href={`/dashboard/feedback?siteId=${siteId}`}>
                  <MessageSquare className="size-3.5" />
                  Full feedback form
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-5 text-center text-sm font-medium text-[#214f43] dark:text-[#9cc2b3]">
            Thanks — saved to your account.{" "}
            <Link
              href={`/dashboard/feedback?siteId=${siteId}`}
              className="underline underline-offset-2"
            >
              Add feature requests
            </Link>
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {NEXT_STEPS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-xl border border-[#11130f]/8 bg-[#f7f7f3]/80 p-4 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <Icon className="size-4 text-[#214f43] dark:text-[#9cc2b3]" />
            <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">{title}</p>
            <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">{body}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <Button
          onClick={onViewSite}
          className="rounded-full bg-[#214f43] hover:bg-[#1a3f36]"
        >
          View live site
          <ArrowRight className="size-4" />
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/dashboard">Go to My sites</Link>
        </Button>
        <Button asChild variant="ghost" className="rounded-full">
          <Link href={settingsUrl}>Site settings &amp; DNS</Link>
        </Button>
      </div>
    </motion.div>
  );
}
