"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Loader2 } from "lucide-react";

import { siteStyle } from "@/lib/site-style";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BookingConfig, SiteData } from "@/lib/types";
import { apiClient } from "@/platform/api/api-client";

interface Slot {
  start: string;
  label: string;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function NativeSlotPicker({
  site,
  slug,
  booking,
}: {
  site: SiteData;
  slug: string;
  booking: BookingConfig;
}) {
  const st = siteStyle(site.design);
  const accent = site.accent;
  const services = booking.services ?? [];

  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Slot | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const minDate = useMemo(() => todayIso(), []);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    setSlotError(null);
    setSelected(null);
    try {
      const data = await apiClient.get<{ slots?: Slot[] }>(
        `/api/booking/slots?slug=${encodeURIComponent(slug)}&date=${encodeURIComponent(date)}`
      );
      setSlots((data.slots as Slot[]) ?? []);
    } catch (err) {
      setSlots([]);
      setSlotError(err instanceof Error ? err.message : "Could not load times.");
    } finally {
      setLoadingSlots(false);
    }
  }, [slug, date]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post("/api/booking", {
        body: {
          slug,
          name,
          phone,
          email,
          slotStart: selected.start,
          service: service || undefined,
          notes: notes || undefined,
          website: honeypot,
        },
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
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
        <h3 className="text-lg font-semibold">You&apos;re booked</h3>
        <p className="text-sm text-muted-foreground">
          {selected?.label} on {date}. Check your email for confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto max-w-lg space-y-5 rounded-2xl border p-6 sm:p-8", st.card)}>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Date</span>
        <Input
          type="date"
          value={date}
          min={minDate}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      <div>
        <p className="mb-2 text-sm font-medium">Available times</p>
        {loadingSlots ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : slotError ? (
          <p className="text-sm text-destructive">{slotError}</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open slots this day.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot.start}
                type="button"
                onClick={() => setSelected(slot)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  selected?.start === slot.start
                    ? "border-foreground bg-foreground text-background"
                    : "hover:border-foreground/40"
                )}
              >
                {slot.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 border-t pt-5">
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

          <p className="text-sm text-muted-foreground">
            Booking <strong>{selected.label}</strong> on {date}
          </p>

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
            <span className="font-medium">Email *</span>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="for confirmation"
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

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Notes</span>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional"
            />
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

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
                Booking…
              </>
            ) : (
              <>
                <CalendarDays className="size-4" />
                Confirm booking
              </>
            )}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
