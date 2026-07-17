"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Star } from "lucide-react";

import { EmailGate } from "@/components/generator/EmailGate";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Button } from "@/components/ui/button";
import { FEEDBACK_FEATURE_OPTIONS } from "@/lib/feedback-options";
import { cn } from "@/lib/utils";
import { apiClient } from "@/platform/api/api-client";

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Okay",
  3: "Good",
  4: "Great",
  5: "Excellent",
};

interface SavedFeedback {
  rating: number;
  experience?: string;
  desiredFeatures?: string;
  featureTags: string[];
  updatedAt: number;
}

export function FeedbackPageContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get("siteId")?.trim() || undefined;

  const [loading, setLoading] = useState(true);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [experience, setExperience] = useState("");
  const [desiredFeatures, setDesiredFeatures] = useState("");
  const [featureTags, setFeatureTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [existing, setExisting] = useState<SavedFeedback | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const session = await apiClient.get<{ email?: string }>("/api/auth/session");
      if (!session.email) {
        setNeedsVerify(true);
        return;
      }
      setEmail(session.email);

      const data = await apiClient.get<{ feedback: SavedFeedback | null }>("/api/feedback");
      if (data.feedback) {
        setExisting(data.feedback);
        setRating(data.feedback.rating);
        setExperience(data.feedback.experience ?? "");
        setDesiredFeatures(data.feedback.desiredFeatures ?? "");
        setFeatureTags(data.feedback.featureTags ?? []);
      }
    } catch {
      setNeedsVerify(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleTag(tag: string) {
    setFeatureTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!rating || saving) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient.post("/api/feedback", {
        body: {
          siteId,
          rating,
          experience: experience.trim() || undefined,
          desiredFeatures: desiredFeatures.trim() || undefined,
          featureTags,
        },
      });
      setSaved(true);
      setExisting({
        rating,
        experience: experience.trim() || undefined,
        desiredFeatures: desiredFeatures.trim() || undefined,
        featureTags,
        updatedAt: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save feedback.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (needsVerify) {
    return (
      <main className="flex min-h-screen flex-col">
        <MarketingNav />
        <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16">
          <p className="text-center text-sm text-muted-foreground">
            Sign in to share feedback. We save one response per account so you can update it anytime.
          </p>
          <EmailGate
            onBack={() => setNeedsVerify(false)}
            onVerified={() => {
              setNeedsVerify(false);
              void load();
            }}
          />
        </div>
        <MarketingFooter />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f3f3ef] dark:bg-[#0d0f0d]">
      <MarketingNav />
      <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-6 sm:py-14">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to My sites
        </Link>

        <div className="mt-6 rounded-[1.5rem] border border-[#11130f]/10 bg-white/85 p-6 shadow-[0_24px_70px_-50px_rgba(17,19,15,0.45)] dark:border-white/10 dark:bg-[#151815] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#214f43] dark:text-[#9cc2b3]">
            Feedback
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#11130f] dark:text-stone-50 sm:text-3xl">
            Help us improve PaperChai
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Rate your experience and tell us which features you want next. Saved to your account
            {email ? ` (${email})` : ""}.
          </p>

          {saved ? (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#214f43]/20 bg-[#dce8e2]/50 p-4 dark:border-[#9cc2b3]/25 dark:bg-[#214f43]/15">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#214f43] dark:text-[#9cc2b3]" />
              <div>
                <p className="font-medium text-[#11130f] dark:text-stone-50">Thanks — feedback saved</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You can update your rating or feature requests anytime.
                </p>
              </div>
            </div>
          ) : existing ? (
            <p className="mt-4 text-sm text-muted-foreground">
              You shared feedback before. Update anything below and save again.
            </p>
          ) : null}

          <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-8">
            <section>
              <h2 className="text-sm font-semibold text-stone-950 dark:text-stone-50">
                1. How was your experience?
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Building, publishing, or editing your site on PaperChai.
              </p>
              <div className="mt-4 flex items-center gap-1">
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
                        "size-9 transition",
                        (hover || rating) >= value
                          ? "fill-[#d8ba70] text-[#d8ba70]"
                          : "text-stone-300 dark:text-stone-600"
                      )}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 ? (
                <p className="mt-2 text-sm font-medium text-[#214f43] dark:text-[#9cc2b3]">
                  {RATING_LABELS[rating]}
                </p>
              ) : null}
            </section>

            <section>
              <h2 className="text-sm font-semibold text-stone-950 dark:text-stone-50">
                2. What worked or felt confusing?
              </h2>
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows={4}
                placeholder="e.g. Google import was fast, but I wasn't sure how to connect my domain…"
                className="mt-3 w-full resize-none rounded-xl border border-[#11130f]/10 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#214f43]/40 dark:border-white/10 dark:bg-[#0d0f0d] dark:text-stone-100"
              />
            </section>

            <section>
              <h2 className="text-sm font-semibold text-stone-950 dark:text-stone-50">
                3. Which features would you like?
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">Pick any that matter to you.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {FEEDBACK_FEATURE_OPTIONS.map((tag) => {
                  const active = featureTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                        active
                          ? "border-[#214f43] bg-[#dce8e2] text-[#173b32] dark:border-[#9cc2b3] dark:bg-[#214f43]/30 dark:text-[#dce8e2]"
                          : "border-[#11130f]/10 bg-white text-stone-600 hover:border-[#214f43]/30 dark:border-white/10 dark:bg-[#0d0f0d] dark:text-stone-300"
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={desiredFeatures}
                onChange={(e) => setDesiredFeatures(e.target.value)}
                rows={3}
                placeholder="Anything else you'd love to see? (optional)"
                className="mt-4 w-full resize-none rounded-xl border border-[#11130f]/10 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#214f43]/40 dark:border-white/10 dark:bg-[#0d0f0d] dark:text-stone-100"
              />
            </section>

            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="submit"
                disabled={!rating || saving}
                className="rounded-full bg-[#214f43] hover:bg-[#1a3f36]"
              >
                {saving ? "Saving…" : existing ? "Update feedback" : "Submit feedback"}
              </Button>
              <SignOutButton className="rounded-full" />
            </div>
          </form>
        </div>
      </div>
      <MarketingFooter />
    </main>
  );
}
