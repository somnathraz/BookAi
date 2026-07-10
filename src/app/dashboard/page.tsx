"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { getPublicSiteHref, getPublicSiteUrl } from "@/lib/site-url";
import { BasicCheckoutButton } from "@/components/billing/BasicCheckoutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingBackdrop } from "@/components/marketing/MarketingBackdrop";
import { DashboardEmpty3D } from "@/components/marketing/DashboardEmpty3D";
import { Tilt3D } from "@/components/marketing/motion-primitives";
import { EmailGate } from "@/components/generator/EmailGate";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import type { ThemeMode } from "@/lib/types";

interface SavedSite {
  id: string;
  slug: string;
  name: string;
  domain: string;
  theme: ThemeMode;
  accent?: string;
  customDomain?: string;
  createdAt: number;
  updatedAt: number;
}

interface BillingSummary {
  plan: "free" | "basic";
  billing: {
    billingPeriod?: "monthly" | "annual";
    billingStatus?: "created" | "authenticated" | "active" | "cancelled" | "halted" | "failed";
    billingChargeAt?: number;
    billingCurrentEnd?: number;
    billingCancelAtCycleEnd?: boolean;
  };
  dashboardNoticeActive: boolean;
  dashboardNoticeDays: number;
}

const DOMAIN_LABEL: Record<string, string> = {
  developer: "Developer",
  designer: "Designer",
  doctor: "Doctor / Clinic",
  consultant: "Consultant",
  photographer: "Photographer",
  restaurant: "Restaurant",
  fitness: "Fitness",
  other: "Business",
};

const EASE = [0.22, 1, 0.36, 1] as const;

export default function DashboardPage() {
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [limit, setLimit] = useState(1);
  const [plan, setPlan] = useState("free");
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sites");
      if (res.status === 401) {
        setNeedsVerify(true);
        return;
      }
      const data = await res.json();
      setNeedsVerify(false);
      setEmail(data.email);
      setSites(data.sites ?? []);
      setLimit(data.limit ?? 1);
      setPlan((data.plan as string) ?? "free");

      const billingRes = await fetch("/api/billing");
      if (billingRes.ok) {
        const billingData = (await billingRes.json()) as BillingSummary;
        setBilling(billingData);
      } else {
        setBilling(null);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function publicHref(site: SavedSite): string {
    const host =
      typeof window !== "undefined" ? window.location.host : undefined;
    return getPublicSiteHref(site.slug, {
      host,
      customDomain: site.customDomain,
    });
  }
  function publicLabel(site: SavedSite): string {
    const host =
      typeof window !== "undefined" ? window.location.host : undefined;
    return getPublicSiteUrl(site.slug, { host, customDomain: site.customDomain }).replace(
      /^https?:\/\//,
      ""
    );
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/sites?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setSites((s) => s.filter((x) => x.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  function formatDateTime(value?: number): string {
    if (!value) return "—";
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <MarketingBackdrop intensity="soft" />
      <MarketingNav />
      <section className="relative mx-auto w-full max-w-5xl flex-1 px-6 pb-24 pt-12">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">My sites</h1>
            {email ? (
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-sm text-muted-foreground">{email}</p>
                <SignOutButton
                  onSignedOut={() => {
                    setEmail(null);
                    setSites([]);
                    setNeedsVerify(true);
                  }}
                />
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Your generated sites live here.
              </p>
            )}
          </div>
          <Button asChild>
            <Link href="/">
              <Plus className="size-4" />
              New site
            </Link>
          </Button>
        </motion.div>

        {loading ? (
          <div className="mt-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : needsVerify ? (
          <div className="mx-auto mt-12 max-w-md rounded-2xl border bg-card/60 p-6">
            <EmailGate onBack={() => load()} onVerified={() => load()} />
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card/60 p-5">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="rounded-full capitalize">
                  {plan} plan
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {sites.length} / {limit} site{limit === 1 ? "" : "s"} used
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/billing">Billing</Link>
                </Button>
                {plan === "basic" ? (
                  <Button variant="outline" size="sm" disabled>
                    Basic active
                  </Button>
                ) : (
                  <BasicCheckoutButton
                    period="annual"
                    size="sm"
                    variant="outline"
                    label="Upgrade to Basic"
                    onSuccess={() => {
                      void load();
                    }}
                  />
                )}
              </div>
            </div>

            {billing?.plan === "basic" &&
            !billing.billing.billingCancelAtCycleEnd &&
            billing.dashboardNoticeActive ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-sm text-foreground">
                  Your Basic plan renews on{" "}
                  <strong>{formatDateTime(billing.billing.billingChargeAt)}</strong>. We&apos;ll
                  remind you {billing.dashboardNoticeDays} days before the due date.
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/billing">Open billing</Link>
                </Button>
              </div>
            ) : null}

            {sites.length === 0 ? (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="mt-6 overflow-hidden rounded-2xl border border-dashed bg-card/40 p-8 text-center sm:p-12"
              >
                <DashboardEmpty3D />
                <p className="mt-6 text-muted-foreground">You haven&apos;t built a site yet.</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Paste your Google Maps link on the home page and publish your
                  first booking-ready site in minutes.
                </p>
                <Button asChild className="mt-6">
                  <Link href="/">
                    <Plus className="size-4" />
                    Create your first site
                  </Link>
                </Button>
              </motion.div>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Edit and republish anytime — your URL stays the same.
                </p>
                <motion.div
                  initial={reduceMotion ? "show" : "hidden"}
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.08 } },
                  }}
                  className="mt-6 grid gap-4 sm:grid-cols-2"
                >
                {sites.map((s) => (
                  <motion.div
                    key={s.id}
                    variants={{
                      hidden: { opacity: 0, y: 24, rotateX: 8 },
                      show: {
                        opacity: 1,
                        y: 0,
                        rotateX: 0,
                        transition: { duration: 0.65, ease: EASE },
                      },
                    }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                  <Tilt3D maxTilt={5} lift className="h-full">
                  <div className="flex h-full flex-col gap-4 rounded-2xl border bg-card/70 p-5 backdrop-blur">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{s.name}</h3>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {publicLabel(s)}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {DOMAIN_LABEL[s.domain] ?? s.domain} ·{" "}
                          {s.updatedAt > s.createdAt
                            ? `Updated ${new Date(s.updatedAt).toLocaleDateString()}`
                            : `Created ${new Date(s.createdAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <span
                        className="mt-1 size-4 shrink-0 rounded-full border"
                        style={{ backgroundColor: s.accent ?? "transparent" }}
                        title="Accent"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" asChild>
                        <Link href={`/edit/${s.id}`}>
                          <Pencil className="size-4" />
                          Edit
                        </Link>
                      </Button>
                      <Button size="sm" variant="secondary" asChild>
                        <Link href={`/dashboard/${s.id}`}>Settings</Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={publicHref(s)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-4" />
                          Open
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => remove(s.id)}
                        disabled={deleting === s.id}
                        className={cn(
                          "text-destructive hover:text-destructive",
                          deleting === s.id && "opacity-60"
                        )}
                      >
                        {deleting === s.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                  </Tilt3D>
                  </motion.div>
                ))}
              </motion.div>
              </>
            )}
          </>
        )}
      </section>
      <MarketingFooter />
    </main>
  );
}
