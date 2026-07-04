import type { BusinessDomain, BookingConfig, SiteData } from "@/lib/types";

const DEFAULT_SERVICES: Record<BusinessDomain, string[]> = {
  doctor: ["Consultation", "Follow-up", "Check-up"],
  restaurant: ["Table for 2", "Table for 4+", "Private event"],
  fitness: ["Intro session", "Personal training", "Group class"],
  consultant: ["Discovery call", "Strategy session", "Workshop"],
  developer: ["Discovery call", "Project kickoff"],
  designer: ["Discovery call", "Brand review"],
  photographer: ["Portrait session", "Event coverage"],
  other: ["General inquiry", "Appointment"],
};

const DEFAULT_LABELS: Record<BusinessDomain, string> = {
  doctor: "Book appointment",
  restaurant: "Request a table",
  fitness: "Book a session",
  consultant: "Book a call",
  developer: "Book a call",
  designer: "Book a call",
  photographer: "Book a session",
  other: "Book with us",
};

export function defaultBookingServices(domain: BusinessDomain): string[] {
  return DEFAULT_SERVICES[domain] ?? DEFAULT_SERVICES.other;
}

export function defaultBookingLabel(domain: BusinessDomain): string {
  return DEFAULT_LABELS[domain] ?? DEFAULT_LABELS.other;
}

/** Insert or remove the booking section in the composed section list. */
export function syncBookingSection(site: SiteData): SiteData {
  const enabled = Boolean(site.booking?.enabled);
  const sections = [...(site.sections ?? [])].filter((s) => s.type !== "booking");

  if (!enabled) {
    return { ...site, sections };
  }

  const bookingSection = {
    type: "booking" as const,
    label: "Booking",
    heading: site.booking?.buttonLabel ?? "Book with us",
  };
  const ctaIdx = sections.findIndex((s) => s.type === "cta");
  if (ctaIdx >= 0) {
    sections.splice(ctaIdx, 0, bookingSection);
  } else {
    sections.push(bookingSection);
  }

  const ctaHref = "#booking";
  return {
    ...site,
    sections,
    cta: { ...site.cta, href: ctaHref },
  };
}

/** Turn on booking for new business sites when the owner has email configured. */
export function applyDefaultBooking(site: SiteData, ownerEmail: string): SiteData {
  if (site.archetype !== "business") return site;
  if (site.booking?.enabled) return syncBookingSection(site);

  const notify =
    site.booking?.notifyEmail?.trim() ||
    site.identity.email?.trim() ||
    ownerEmail.trim();
  if (!notify) return site;

  const booking: BookingConfig = {
    enabled: true,
    notifyEmail: notify,
    services: defaultBookingServices(site.identity.domain),
    buttonLabel: defaultBookingLabel(site.identity.domain),
  };

  return syncBookingSection({ ...site, booking });
}
