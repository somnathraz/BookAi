/** Allowed external calendar providers for embed / link-out booking. */
const ALLOWED_HOSTS = [
  "calendly.com",
  "cal.com",
  "calendar.google.com",
  "outlook.office.com",
  "outlook.office365.com",
  "bookings.microsoft.com",
];

function hostAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

/**
 * Validate and normalize a calendar scheduling URL (https only).
 * Returns null when the host is not on the allowlist.
 */
export function normalizeCalendarUrl(input: string | undefined | null): string | null {
  const raw = input?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (url.protocol !== "https:") return null;
    if (!hostAllowed(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Provider label for UI copy. */
export function calendarProviderLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("calendly")) return "Calendly";
    if (host.includes("cal.com")) return "Cal.com";
    if (host.includes("google")) return "Google Calendar";
    if (host.includes("outlook") || host.includes("microsoft")) return "Outlook";
    return "Calendar";
  } catch {
    return "Calendar";
  }
}

/**
 * iframe src for inline embed. Falls back to the page URL when embed path
 * is unknown — most providers still render in an iframe.
 */
export function calendarEmbedSrc(url: string): string {
  const normalized = normalizeCalendarUrl(url);
  if (!normalized) return url;

  const u = new URL(normalized);
  const host = u.hostname.replace(/^www\./, "");

  if (host === "calendly.com" || host.endsWith(".calendly.com")) {
    u.searchParams.set("embed", "true");
    u.searchParams.set("hide_gdpr_banner", "1");
    return u.toString();
  }

  if (host === "cal.com" || host === "app.cal.com") {
    if (!u.pathname.endsWith("/embed")) {
      u.pathname = `${u.pathname.replace(/\/$/, "")}/embed`;
    }
    return u.toString();
  }

  return normalized;
}

/** Whether this provider is likely to work inline (vs link-out only). */
export function supportsInlineEmbed(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return (
      host.includes("calendly") ||
      host.includes("cal.com") ||
      host === "calendar.google.com"
    );
  } catch {
    return false;
  }
}
