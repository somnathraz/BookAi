/** Public product name — use everywhere user-facing. */
export const PRODUCT_NAME = "Kritvani";

/** Canonical production apex domain (no protocol). Used when env vars are unset. */
export const APP_DOMAIN = "kritvani.com";

/**
 * Former apex domains. Requests on these (and their subdomains) are 308'd to
 * the Kritvani equivalents by proxy.ts until the domains lapse. /api stays
 * served so old webhook/OAuth callback URLs keep working during the move.
 */
export const LEGACY_APP_DOMAINS = ["paperchaiapp.com"] as const;

/** App logo in /public — use via Logo / LogoMark components. */
export const LOGO_PATH = "/logo.png";

export const CUSTOM_SITE_URL = "https://somanathkhadanga.com";

export const CUSTOM_SITE_HOST = "somanathkhadanga.com";
