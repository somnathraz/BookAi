"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2 } from "lucide-react";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { EmailGate } from "@/components/generator/EmailGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CustomDomainPanel } from "@/components/dashboard/CustomDomainPanel";
import type { BookingConfig, BookingStatus, DaySlotConfig } from "@/lib/types";
import { ApiClientError, apiClient } from "@/platform/api/api-client";

interface BookingRow {
  id: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string;
  preferredDate?: string;
  preferredTime?: string;
  slotStart?: string;
  service?: string;
  notes?: string;
  source?: string;
  status: BookingStatus;
  createdAt: number;
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  contacted: "Contacted",
  cancelled: "Cancelled",
  done: "Done",
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DEFAULT_WEEKLY: DaySlotConfig[] = [1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  start: "10:00",
  end: "18:00",
}));

function weeklyForUi(booking: BookingConfig): DaySlotConfig[] {
  const map = new Map((booking.native?.weekly ?? []).map((d) => [d.day, d]));
  return WEEKDAYS.map((_, day) => map.get(day) ?? { day, start: "10:00", end: "18:00" });
}

function formatWhen(b: BookingRow): string | null {
  if (b.slotStart) {
    try {
      return new Date(b.slotStart).toLocaleString();
    } catch {
      return b.slotStart;
    }
  }
  if (b.preferredDate || b.preferredTime) {
    return [b.preferredDate, b.preferredTime].filter(Boolean).join(" · ");
  }
  return null;
}

export default function SiteManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: siteId } = use(params);
  const [loading, setLoading] = useState(true);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState("");
  const [siteName, setSiteName] = useState("");
  const [booking, setBooking] = useState<BookingConfig>({ enabled: false });
  const [servicesText, setServicesText] = useState("");
  const [blackoutText, setBlackoutText] = useState("");
  const [weekly, setWeekly] = useState<DaySlotConfig[]>(DEFAULT_WEEKLY);
  const [dayOpen, setDayOpen] = useState<boolean[]>(() => Array(7).fill(false));
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const nativeEnabled = Boolean(booking.native?.enabled);

  const syncWeeklyState = useCallback((b: BookingConfig) => {
    const rows = weeklyForUi(b);
    setWeekly(rows);
    const open = WEEKDAYS.map((_, day) =>
      Boolean((b.native?.weekly ?? []).some((d) => d.day === day))
    );
    setDayOpen(open.length === 7 ? open : Array(7).fill(false));
    setBlackoutText((b.native?.blackoutDates ?? []).join("\n"));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [siteData, bookingsData] = await Promise.all([
        apiClient.get<{ slug: string; name: string; site?: { booking?: BookingConfig } }>(
          `/api/sites/${encodeURIComponent(siteId)}`
        ),
        apiClient.get<{ bookings?: BookingRow[] }>(
          `/api/sites/${encodeURIComponent(siteId)}/bookings`
        ),
      ]);
      setSlug(siteData.slug);
      setSiteName(siteData.name);
      const b = siteData.site?.booking ?? { enabled: false };
      setBooking(b);
      setServicesText((b.services ?? []).join("\n"));
      syncWeeklyState(b);

      setBookings(bookingsData.bookings ?? []);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) setNeedsVerify(true);
    } finally {
      setLoading(false);
    }
  }, [siteId, syncWeeklyState]);

  useEffect(() => {
    void load();
  }, [load]);

  const weeklyPayload = useMemo((): DaySlotConfig[] => {
    return weekly
      .map((row, day) => ({ ...row, day }))
      .filter((_, day) => dayOpen[day]);
  }, [weekly, dayOpen]);

  async function saveBooking() {
    setSaving(true);
    setMessage(null);
    try {
      const services = servicesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const blackoutDates = blackoutText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const native = nativeEnabled
        ? {
            enabled: true,
            slotMinutes: booking.native?.slotMinutes ?? 30,
            weekly: weeklyPayload,
            blackoutDates: blackoutDates.length ? blackoutDates : undefined,
          }
        : { enabled: false, weekly: booking.native?.weekly ?? [] };

      const data = await apiClient.patch<{ booking: BookingConfig }>(
        `/api/sites/${encodeURIComponent(siteId)}/booking`,
        { body: {
          ...booking,
          services: services.length ? services : undefined,
          native,
        } }
      );
      const saved = data.booking;
      setBooking(saved);
      syncWeeklyState(saved);
      setMessage("Booking settings saved. Your live site will update immediately.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function toggleNative(enabled: boolean) {
    setBooking((b) => ({
      ...b,
      native: enabled
        ? {
            enabled: true,
            slotMinutes: b.native?.slotMinutes ?? 30,
            weekly: b.native?.weekly?.length ? b.native.weekly : DEFAULT_WEEKLY,
            blackoutDates: b.native?.blackoutDates,
          }
        : { enabled: false, weekly: b.native?.weekly ?? [] },
    }));
    if (enabled) {
      setDayOpen([false, true, true, true, true, true, true]);
    }
  }

  async function updateStatus(bookingId: string, status: BookingStatus) {
    await apiClient.patch(`/api/sites/${encodeURIComponent(siteId)}/bookings`, {
      body: { bookingId, status },
    });
    setBookings((rows) => rows.map((r) => (r.id === bookingId ? { ...r, status } : r)));
  }

  return (
    <main className="flex min-h-screen flex-col">
      <MarketingNav />
      <section className="mx-auto w-full max-w-3xl flex-1 px-6 pb-24 pt-12">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          My sites
        </Link>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : needsVerify ? (
          <div className="rounded-2xl border bg-card/60 p-6">
            <EmailGate onBack={() => load()} onVerified={() => load()} />
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-semibold">{siteName}</h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">/{slug}</p>
            </div>

            <CustomDomainPanel siteId={siteId} />

            <div className="space-y-5 rounded-2xl border bg-card/60 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Online booking</h2>
                  <p className="text-sm text-muted-foreground">
                    Visitors can send appointment requests from your live site.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={booking.enabled}
                    onChange={(e) => setBooking((b) => ({ ...b, enabled: e.target.checked }))}
                    className="size-4 rounded border"
                  />
                  Enabled
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Notification email</span>
                <Input
                  type="email"
                  value={booking.notifyEmail ?? ""}
                  onChange={(e) => setBooking((b) => ({ ...b, notifyEmail: e.target.value }))}
                  placeholder="you@email.com"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Button label</span>
                <Input
                  value={booking.buttonLabel ?? ""}
                  onChange={(e) => setBooking((b) => ({ ...b, buttonLabel: e.target.value }))}
                  placeholder="Book appointment"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Services (one per line)</span>
                <textarea
                  value={servicesText}
                  onChange={(e) => setServicesText(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder={"Consultation\nFollow-up"}
                />
              </label>

              <div className="rounded-xl border p-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold">Built-in scheduling</h3>
                    <p className="text-xs text-muted-foreground">
                      Visitors pick an open slot — no Calendly needed.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={nativeEnabled}
                      onChange={(e) => toggleNative(e.target.checked)}
                      className="size-4 rounded border"
                    />
                    On
                  </label>
                </div>

                {nativeEnabled ? (
                  <>
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium">Slot length (minutes)</span>
                      <select
                        value={booking.native?.slotMinutes ?? 30}
                        onChange={(e) =>
                          setBooking((b) => ({
                            ...b,
                            native: {
                              ...b.native!,
                              enabled: true,
                              weekly: b.native?.weekly ?? DEFAULT_WEEKLY,
                              slotMinutes: Number(e.target.value),
                            },
                          }))
                        }
                        className="h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 text-sm"
                      >
                        {[15, 30, 45, 60, 90, 120].map((m) => (
                          <option key={m} value={m}>
                            {m} min
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Weekly hours</p>
                      <ul className="space-y-2">
                        {WEEKDAYS.map((name, day) => (
                          <li
                            key={name}
                            className="flex flex-wrap items-center gap-2 text-sm sm:gap-3"
                          >
                            <label className="flex w-28 items-center gap-2">
                              <input
                                type="checkbox"
                                checked={dayOpen[day]}
                                onChange={(e) =>
                                  setDayOpen((open) => {
                                    const next = [...open];
                                    next[day] = e.target.checked;
                                    return next;
                                  })
                                }
                                className="size-4 rounded border"
                              />
                              {name}
                            </label>
                            <Input
                              type="time"
                              value={weekly[day]?.start ?? "10:00"}
                              disabled={!dayOpen[day]}
                              onChange={(e) =>
                                setWeekly((rows) => {
                                  const next = [...rows];
                                  next[day] = { ...next[day], day, start: e.target.value };
                                  return next;
                                })
                              }
                              className="h-8 w-28"
                            />
                            <span className="text-muted-foreground">to</span>
                            <Input
                              type="time"
                              value={weekly[day]?.end ?? "18:00"}
                              disabled={!dayOpen[day]}
                              onChange={(e) =>
                                setWeekly((rows) => {
                                  const next = [...rows];
                                  next[day] = { ...next[day], day, end: e.target.value };
                                  return next;
                                })
                              }
                              className="h-8 w-28"
                            />
                          </li>
                        ))}
                      </ul>
                    </div>

                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium">Blackout dates (YYYY-MM-DD, one per line)</span>
                      <textarea
                        value={blackoutText}
                        onChange={(e) => setBlackoutText(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        placeholder={"2026-12-25\n2026-01-01"}
                      />
                    </label>
                  </>
                ) : null}
              </div>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Calendar link (Calendly, Cal.com, …)</span>
                <Input
                  value={booking.calendarUrl ?? ""}
                  onChange={(e) => setBooking((b) => ({ ...b, calendarUrl: e.target.value }))}
                  placeholder="https://calendly.com/your-name/30min"
                />
                <span className="text-xs text-muted-foreground">
                  Optional external scheduler — visitors get a Calendar tab with an inline embed.
                </span>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">WhatsApp number</span>
                <Input
                  value={booking.whatsappNumber ?? ""}
                  onChange={(e) => setBooking((b) => ({ ...b, whatsappNumber: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
                <span className="text-xs text-muted-foreground">
                  Shows a WhatsApp button with a pre-filled message on your booking form.
                </span>
              </label>

              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

              <Button onClick={() => void saveBooking()} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Save booking settings
              </Button>
            </div>

            <div className="rounded-2xl border bg-card/60 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">Recent requests</h2>
                {bookings.length > 0 ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/sites/${encodeURIComponent(siteId)}/bookings/export`}>
                      <Download className="size-4" />
                      Export CSV
                    </a>
                  </Button>
                ) : null}
              </div>
              {bookings.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No booking requests yet.</p>
              ) : (
                <ul className="mt-4 divide-y">
                  {bookings.map((b) => {
                    const when = formatWhen(b);
                    return (
                      <li
                        key={b.id}
                        className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">{b.visitorName}</p>
                          <p className="text-sm text-muted-foreground">{b.visitorPhone}</p>
                          {b.visitorEmail ? (
                            <p className="text-sm text-muted-foreground">{b.visitorEmail}</p>
                          ) : null}
                          {b.service ? (
                            <p className="text-sm text-muted-foreground">{b.service}</p>
                          ) : null}
                          {when ? (
                            <p className="text-xs text-muted-foreground">{when}</p>
                          ) : null}
                          {b.source === "slot" ? (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Slot booking
                            </Badge>
                          ) : null}
                          {b.notes ? (
                            <p className="mt-1 text-sm text-muted-foreground">{b.notes}</p>
                          ) : null}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(b.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{STATUS_LABEL[b.status]}</Badge>
                          <select
                            value={b.status}
                            onChange={(e) =>
                              void updateStatus(b.id, e.target.value as BookingStatus)
                            }
                            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                          >
                            {(Object.keys(STATUS_LABEL) as BookingStatus[]).map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <Button variant="outline" asChild>
              <Link href={`/edit/${siteId}`}>Edit site content</Link>
            </Button>
          </div>
        )}
      </section>
      <MarketingFooter />
    </main>
  );
}
