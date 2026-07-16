/**
 * Client-side GA4 helpers for PaperChai (paperchaiapp.com).
 * No-ops outside production or when gtag / measurement ID is missing.
 */

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/** Display prices from PricingPlans — used for Ads purchase value. */
export const BASIC_PLAN_VALUE_INR: Record<"monthly" | "annual", number> = {
  monthly: 199,
  annual: 1499,
};

type GtagEventParams = Record<string, string | number | boolean | undefined>;

function canTrack(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(measurementId) &&
    process.env.NODE_ENV === "production" &&
    typeof window.gtag === "function"
  );
}

export function trackEvent(
  name: string,
  params?: GtagEventParams,
  options?: { event_callback?: () => void }
): void {
  if (!canTrack()) {
    options?.event_callback?.();
    return;
  }

  window.gtag("event", name, {
    ...params,
    send_to: measurementId,
    transport_type: "beacon",
    ...(options?.event_callback ? { event_callback: options.event_callback } : {}),
  });
}

/** OTP verified — funnel start for Ads. */
export function trackSignUp(params: {
  intent: "continue" | "generate";
}): void {
  trackEvent("sign_up", {
    method: "email_otp",
    intent: params.intent,
  });
}

/**
 * Site published. Primary Ads conversion when is_update is false.
 * Use waitForBeacon before hard redirects so the hit is not dropped.
 */
export function trackSitePublished(
  params: {
    site_id: string;
    slug: string;
    is_update: boolean;
    engine: "ai" | "template";
  },
  options?: { event_callback?: () => void }
): void {
  const eventName = params.is_update ? "site_updated" : "site_created";
  trackEvent(
    eventName,
    {
      site_id: params.site_id,
      slug: params.slug,
      engine: params.engine,
    },
    options
  );
}

/** Razorpay verify succeeded — purchase + plan upgrade. */
export function trackPurchase(params: {
  period: "monthly" | "annual";
  transaction_id?: string;
}): void {
  const value = BASIC_PLAN_VALUE_INR[params.period];
  trackEvent("purchase", {
    currency: "INR",
    value,
    plan: "basic",
    billing_period: params.period,
    transaction_id: params.transaction_id,
  });
  trackEvent("plan_upgraded", {
    plan: "basic",
    billing_period: params.period,
    value,
    currency: "INR",
  });
}

/**
 * Ensures gtag beacon has time to leave before a hard navigation.
 * Falls back after `timeoutMs` if event_callback never fires.
 */
export function waitForBeacon(
  fire: (done: () => void) => void,
  timeoutMs = 1000
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const timer = window.setTimeout(done, timeoutMs);
    fire(() => {
      window.clearTimeout(timer);
      done();
    });
  });
}
