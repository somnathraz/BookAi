import "server-only";

/**
 * Server configuration is read here instead of throughout feature code. Values
 * remain lazy so local development can run without optional integrations.
 */
export function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function positiveIntegerEnv(name: string, fallback: number): number {
  const value = Number.parseInt(optionalEnv(name) ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl:
    optionalEnv("DATABASE_URL") ?? optionalEnv("bookAi_DATABASE_URL") ?? optionalEnv("POSTGRES_URL") ?? optionalEnv("bookAi_POSTGRES_URL") ?? optionalEnv("bookAi_POSTGRES_PRISMA_URL"),
  sessionSecret: optionalEnv("BOOKAI_SECRET"),
  sessionDays: positiveIntegerEnv("BOOKAI_SESSION_DAYS", 30),
  sentryDsn: optionalEnv("SENTRY_DSN"),
  cronSecret: optionalEnv("CRON_SECRET"),
  billingReminderSecret: optionalEnv("BILLING_REMINDER_SECRET"),
  lifecycleEmailSecret: optionalEnv("LIFECYCLE_EMAIL_SECRET"),
  googlePlacesApiKey: optionalEnv("GOOGLE_PLACES_API_KEY"),
  serpApiKey: optionalEnv("SERP_API_KEY"),
  legalContactEmail: optionalEnv("LEGAL_CONTACT_EMAIL"),
  razorpayKeyId: optionalEnv("RAZORPAY_API_KEY") ?? optionalEnv("RAZORPAY_KEY_ID"),
  razorpaySecret: optionalEnv("RAZORPAY_SECRET") ?? optionalEnv("RAZORPAY_KEY_SECRET"),
  razorpayWebhookSecret: optionalEnv("RAZORPAY_WEBHOOK_SECRET"),
  razorpayBasicMonthlyPlanId: optionalEnv("RAZORPAY_PLAN_BASIC_MONTHLY"),
  razorpayBasicAnnualPlanId: optionalEnv("RAZORPAY_PLAN_BASIC_ANNUAL"),
  customDomainAllowFree: optionalEnv("CUSTOM_DOMAIN_ALLOW_FREE") === "true",
  brandingAllowFree: optionalEnv("BRANDING_ALLOW_FREE") === "true",
  bookingAllowFree: optionalEnv("BOOKING_ALLOW_FREE"),
  smtpPassword: optionalEnv("SES_SMTP_PASSWORD") ?? optionalEnv("GMAIL_APP_PASSWORD"),
} as const;
