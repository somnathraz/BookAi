import "server-only";

import {
  getPlan,
  listAccountsForUpgradeNudge,
  listSites,
  markUpgradeNudgeSent,
  markWelcomeEmailSent,
  welcomeEmailAlreadySent,
} from "@/lib/accounts";
import {
  sendSitePublishedEmail,
  sendUpgradeNudgeEmail,
  sendWelcomeEmail,
} from "@/lib/email";
import { getAppBaseUrl, getPublicSiteUrl, getSiteRootDomain } from "@/lib/site-url";

function appUrl(path: string): string {
  return `${getAppBaseUrl()}${path}`;
}

export async function maybeSendWelcomeEmail(email: string): Promise<void> {
  if (await welcomeEmailAlreadySent(email)) return;
  await sendWelcomeEmail(email, {
    createUrl: appUrl("/"),
    dashboardUrl: appUrl("/dashboard"),
  });
  await markWelcomeEmailSent(email);
}

export async function sendPublishLifecycleEmails(
  email: string,
  site: { id: string; slug: string; name: string },
  host?: string | null
): Promise<void> {
  const plan = await getPlan(email);
  const liveUrl = getPublicSiteUrl(site.slug, { host });
  const root = getSiteRootDomain();
  const subdomainNote = root
    ? `Your site also works at ${site.slug}.${root} when wildcard DNS is enabled.`
    : undefined;

  await sendSitePublishedEmail(email, {
    siteName: site.name,
    liveUrl,
    dashboardUrl: appUrl("/dashboard"),
    settingsUrl: appUrl(`/dashboard/${site.id}`),
    pricingUrl: appUrl("/pricing"),
    feedbackUrl: appUrl(`/dashboard/feedback?siteId=${site.id}`),
    subdomainNote,
    onFreePlan: plan === "free",
  });
}

export async function sendDueUpgradeNudges(): Promise<number> {
  const emails = await listAccountsForUpgradeNudge();
  let sent = 0;

  for (const email of emails) {
    const sites = await listSites(email);
    const latest = sites[0];
    await sendUpgradeNudgeEmail(email, {
      dashboardUrl: appUrl("/dashboard"),
      pricingUrl: appUrl("/pricing"),
      siteName: latest?.name,
    });
    await markUpgradeNudgeSent(email);
    sent += 1;
  }

  return sent;
}
