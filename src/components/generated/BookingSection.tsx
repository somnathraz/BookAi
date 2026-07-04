"use client";

import { useState } from "react";
import {
  CalendarDays,
  Check,
  ExternalLink,
  Loader2,
  MessageCircle,
} from "lucide-react";

import { NativeSlotPicker } from "@/components/generated/NativeSlotPicker";
import {
  calendarEmbedSrc,
  calendarProviderLabel,
  supportsInlineEmbed,
} from "@/lib/calendar-embed";
import { buildWhatsAppBookingUrl } from "@/lib/whatsapp";
import { siteStyle } from "@/lib/site-style";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BookingConfig, SiteData, SiteSection } from "@/lib/types";

type BookingMode = "native" | "calendar" | "form";

function defaultMode(booking: BookingConfig): BookingMode {
  if (booking.native?.enabled) return "native";
  if (booking.calendarUrl) return "calendar";
  return "form";
}

export function BookingSection({
  site,
  slug,
  section,
  showWhatsApp = false,
}: {
  site: SiteData;
  slug: string;
  section?: SiteSection;
  showWhatsApp?: boolean;
}) {
  const booking = site.booking;
  const st = siteStyle(site.design);
  const accent = site.accent;

  const hasNative = Boolean(booking?.native?.enabled);
  const hasCalendar = Boolean(booking?.calendarUrl);
  const hasTabs = (hasNative ? 1 : 0) + (hasCalendar ? 1 : 0) + 1 > 1;

  const [mode, setMode] = useState<BookingMode>(() =>
    booking ? defaultMode(booking) : "form"
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [service, setService] = useState("");
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!booking?.enabled) return null;

  const heading = section?.heading ?? booking.buttonLabel ?? "Book with us";
  const label = section?.label ?? "Booking";
  const services = booking.services ?? [];
  const calendarUrl = booking.calendarUrl!;
  const provider = hasCalendar ? calendarProviderLabel(calendarUrl) : null;
  const embedSrc = hasCalendar ? calendarEmbedSrc(calendarUrl) : null;
  const inlineEmbed = hasCalendar && supportsInlineEmbed(calendarUrl);

  const subheading =
    hasNative && hasCalendar
      ? "Book a slot, use our calendar, or send a request — whatever works for you."
      : hasNative
        ? "Pick an open slot or send a request and we'll confirm."
        : hasCalendar
          ? "Pick a time that works for you, or send a request and we'll confirm."
          : "Send a request and we'll confirm shortly.";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name,
          phone,
          email: email || undefined,
          preferredDate: preferredDate || undefined,
          preferredTime: preferredTime || undefined,
          service: service || undefined,
          notes: notes || undefined,
          website: honeypot,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data.error as string) ?? "Could not send request.");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function whatsappHref(): string | null {
    const digits = booking?.whatsappNumber?.replace(/\D/g, "");
    if (!digits || digits.length < 10) return null;
    return buildWhatsAppBookingUrl(digits, {
      siteName: site.identity.name,
      visitorName: name || undefined,
      preferredDate: preferredDate || undefined,
      preferredTime: preferredTime || undefined,
      service: service || undefined,
      notes: notes || undefined,
    });
  }

  const waUrl = showWhatsApp ? whatsappHref() : null;

  return (
    <section id="booking" className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-8 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <h2 className={cn("mt-2 text-3xl sm:text-4xl", st.heading)}>{heading}</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{subheading}</p>
      </div>

      {hasTabs ? (
        <div className="mx-auto mb-6 flex max-w-xl justify-center gap-1 rounded-full border bg-card/60 p-1">
          {hasNative ? (
            <button
              type="button"
              onClick={() => setMode("native")}
              className={cn(
                "flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                mode === "native"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Book a slot
            </button>
          ) : null}
          {hasCalendar ? (
            <button
              type="button"
              onClick={() => setMode("calendar")}
              className={cn(
                "flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                mode === "calendar"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Calendar
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setMode("form")}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
              mode === "form"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Send request
          </button>
        </div>
      ) : null}

      {hasNative && mode === "native" ? (
        <NativeSlotPicker site={site} slug={slug} booking={booking} />
      ) : null}

      {hasCalendar && mode === "calendar" ? (
        <div className={cn("mx-auto max-w-3xl overflow-hidden rounded-2xl border", st.card)}>
          {inlineEmbed && embedSrc ? (
            <iframe
              src={embedSrc}
              title={`Book with ${site.identity.name} via ${provider}`}
              className="w-full border-0 bg-background"
              style={{ minHeight: "min(700px, 80vh)" }}
              loading="lazy"
              allow="fullscreen"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 p-10 text-center">
              <CalendarDays className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Schedule directly through {provider}.
              </p>
              <Button size="lg" asChild className={st.ctaRadius}>
                <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Open {provider}
                </a>
              </Button>
            </div>
          )}
          <p className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
            Powered by {provider}
            {" · "}
            <button
              type="button"
              onClick={() => setMode("form")}
              className="underline-offset-2 hover:underline"
            >
              Prefer to send a request instead?
            </button>
          </p>
        </div>
      ) : null}

      {mode === "form" && success ? (
        <div
          className={cn(
            "mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border p-8 text-center",
            st.card
          )}
        >
          <span
            className="flex size-12 items-center justify-center rounded-full"
            style={accent ? { backgroundColor: `${accent}22`, color: accent } : undefined}
          >
            <Check className="size-6" />
          </span>
          <h3 className="text-lg font-semibold">Request sent</h3>
          <p className="text-sm text-muted-foreground">
            We&apos;ll get back to you soon to confirm your booking.
          </p>
        </div>
      ) : null}

      {mode === "form" && !success ? (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className={cn("mx-auto max-w-lg space-y-4 rounded-2xl border p-6 sm:p-8", st.card)}
        >
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Name *</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Phone *</span>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                required
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Email</span>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="optional"
            />
          </label>

          {services.length > 0 ? (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Service</span>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">Select…</option>
                {services.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Preferred date</span>
              <Input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Preferred time</span>
              <Input
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                placeholder="e.g. morning, 3pm"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Notes</span>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything we should know?"
            />
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className={st.ctaRadius}
              style={accent ? { backgroundColor: accent } : undefined}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <CalendarDays className="size-4" />
                  {booking.buttonLabel ?? "Send request"}
                </>
              )}
            </Button>

            {waUrl ? (
              <Button size="lg" variant="outline" asChild className={st.ctaRadius}>
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" />
                  WhatsApp
                </a>
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}
    </section>
  );
}
