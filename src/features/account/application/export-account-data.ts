import "server-only";

import { getAccountBilling, listSites } from "@/lib/accounts";
import { listBookingsForSite } from "@/lib/booking";
import { getAccountFeedback } from "@/lib/feedback";
import { normalizeEmail } from "@/lib/otp";

export interface AccountDataExport {
  exportedAt: string;
  email: string;
  billing: {
    plan: string;
    subscriptionId?: string;
    billingPeriod?: string;
    billingStatus?: string;
    billingUpdatedAt?: string;
    billingStartedAt?: string;
    billingCurrentStart?: string;
    billingCurrentEnd?: string;
    billingChargeAt?: string;
    billingCancelAtCycleEnd?: boolean;
    billingCancelledAt?: string;
  };
  sites: Array<{
    id: string;
    slug: string;
    name: string;
    domain: string;
    theme: string;
    accent?: string;
    customDomain?: string;
    customDomainVerified?: boolean;
    createdAt: string;
    updatedAt: string;
    site: unknown;
    bookings: unknown[];
  }>;
  feedback: {
    rating: number;
    experience?: string;
    desiredFeatures?: string;
    featureTags: string[];
    siteId?: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

function iso(ms?: number): string | undefined {
  return typeof ms === "number" ? new Date(ms).toISOString() : undefined;
}

export async function exportAccountData(email: string): Promise<AccountDataExport> {
  const normalized = normalizeEmail(email);
  const [billing, sites, feedback] = await Promise.all([
    getAccountBilling(normalized),
    listSites(normalized),
    getAccountFeedback(normalized),
  ]);

  const sitesWithBookings = await Promise.all(
    sites.map(async (stored) => {
      const bookings = await listBookingsForSite(normalized, stored.id);
      return {
        id: stored.id,
        slug: stored.slug,
        name: stored.name,
        domain: stored.domain,
        theme: stored.theme,
        accent: stored.accent,
        customDomain: stored.customDomain,
        customDomainVerified: stored.customDomainVerified,
        createdAt: new Date(stored.createdAt).toISOString(),
        updatedAt: new Date(stored.updatedAt).toISOString(),
        site: stored.site,
        bookings: bookings.map((b) => ({
          id: b.id,
          siteId: b.siteId,
          slug: b.slug,
          status: b.status,
          visitorName: b.visitorName,
          visitorPhone: b.visitorPhone,
          visitorEmail: b.visitorEmail,
          preferredDate: b.preferredDate,
          preferredTime: b.preferredTime,
          service: b.service,
          notes: b.notes,
          source: b.source,
          slotStart: b.slotStart,
          createdAt: new Date(b.createdAt).toISOString(),
        })),
      };
    })
  );

  return {
    exportedAt: new Date().toISOString(),
    email: normalized,
    billing: {
      plan: billing.plan,
      subscriptionId: billing.subscriptionId,
      billingPeriod: billing.billingPeriod,
      billingStatus: billing.billingStatus,
      billingUpdatedAt: iso(billing.billingUpdatedAt),
      billingStartedAt: iso(billing.billingStartedAt),
      billingCurrentStart: iso(billing.billingCurrentStart),
      billingCurrentEnd: iso(billing.billingCurrentEnd),
      billingChargeAt: iso(billing.billingChargeAt),
      billingCancelAtCycleEnd: billing.billingCancelAtCycleEnd,
      billingCancelledAt: iso(billing.billingCancelledAt),
    },
    sites: sitesWithBookings,
    feedback: feedback
      ? {
          rating: feedback.rating,
          experience: feedback.experience,
          desiredFeatures: feedback.desiredFeatures,
          featureTags: feedback.featureTags,
          siteId: feedback.siteId,
          createdAt: new Date(feedback.createdAt).toISOString(),
          updatedAt: new Date(feedback.updatedAt).toISOString(),
        }
      : null,
  };
}
