/** Browser-safe configuration. Only NEXT_PUBLIC values belong here. */
export const publicEnv = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim(),
  siteDomain: process.env.NEXT_PUBLIC_SITE_DOMAIN?.trim(),
  vercelUrl: process.env.VERCEL_URL?.trim(),
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim(),
  clarityProjectId: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim(),
} as const;
