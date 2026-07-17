import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { PRODUCT_NAME } from "@/lib/brand";
import { resolveEmailEnv } from "@/lib/ai/provider";

interface EmailConfig {
  transporter: Transporter;
  from: string;
}

// Prefer Amazon SES (SMTP) when configured; fall back to Gmail.
// SES SMTP reuses nodemailer — no AWS SDK needed.
function getEmailConfig(): EmailConfig | null {
  const e = resolveEmailEnv();

  if (e.from && e.sesUser && e.sesPass && e.sesHost) {
    return {
      transporter: nodemailer.createTransport({
        host: e.sesHost,
        port: 587,
        secure: false, // STARTTLS on 587
        auth: { user: e.sesUser, pass: e.sesPass },
      }),
      from: e.from,
    };
  }

  if (e.gmailUser && e.gmailPass) {
    return {
      transporter: nodemailer.createTransport({
        service: "gmail",
        auth: { user: e.gmailUser, pass: e.gmailPass },
      }),
      from: e.from || e.gmailUser,
    };
  }

  return null;
}

export function hasEmailTransport(): boolean {
  return getEmailConfig() !== null;
}

export async function sendOtp(to: string, code: string): Promise<void> {
  const config = getEmailConfig();
  if (!config) {
    // Dev fallback: no SES/Gmail configured — log the code so the OTP flow is
    // still testable locally. The route also returns it in dev.
    console.log(`\n[${PRODUCT_NAME}] DEV verification code for ${to}: ${code}\n`);
    return;
  }
  await config.transporter.sendMail({
    from: `${PRODUCT_NAME} <${config.from}>`,
    to,
    subject: `${code} is your ${PRODUCT_NAME} verification code`,
    text: `Your ${PRODUCT_NAME} verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:420px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px;font-size:18px">Verify your email</h2>
        <p style="color:#555;margin:0 0 20px">Enter this code in ${PRODUCT_NAME} to start generating your site.</p>
        <div style="font-size:34px;font-weight:700;letter-spacing:8px;text-align:center;padding:16px;background:#f4f4f5;border-radius:12px">${code}</div>
        <p style="color:#888;font-size:13px;margin:20px 0 0">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div>`,
  });
}

export interface BookingNotification {
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string;
  preferredDate?: string;
  preferredTime?: string;
  service?: string;
  notes?: string;
  slug: string;
}

export async function sendBookingNotification(
  to: string,
  siteName: string,
  booking: BookingNotification
): Promise<void> {
  const config = getEmailConfig();
  const lines = [
    `New booking request for ${siteName}`,
    "",
    `Name: ${booking.visitorName}`,
    `Phone: ${booking.visitorPhone}`,
    booking.visitorEmail ? `Email: ${booking.visitorEmail}` : null,
    booking.service ? `Service: ${booking.service}` : null,
    booking.preferredDate ? `Preferred date: ${booking.preferredDate}` : null,
    booking.preferredTime ? `Preferred time: ${booking.preferredTime}` : null,
    booking.notes ? `Notes: ${booking.notes}` : null,
    "",
    `Site: ${booking.slug}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (!config) {
    console.log(`\n[${PRODUCT_NAME}] DEV booking notification to ${to}:\n${lines}\n`);
    return;
  }

  await config.transporter.sendMail({
    from: `${PRODUCT_NAME} <${config.from}>`,
    to,
    subject: `New booking request — ${siteName}`,
    text: lines,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px;font-size:18px">New booking request</h2>
        <p style="color:#555;margin:0 0 16px">${siteName}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#888">Name</td><td style="padding:6px 0">${booking.visitorName}</td></tr>
          <tr><td style="padding:6px 0;color:#888">Phone</td><td style="padding:6px 0">${booking.visitorPhone}</td></tr>
          ${booking.visitorEmail ? `<tr><td style="padding:6px 0;color:#888">Email</td><td style="padding:6px 0">${booking.visitorEmail}</td></tr>` : ""}
          ${booking.service ? `<tr><td style="padding:6px 0;color:#888">Service</td><td style="padding:6px 0">${booking.service}</td></tr>` : ""}
          ${booking.preferredDate ? `<tr><td style="padding:6px 0;color:#888">Date</td><td style="padding:6px 0">${booking.preferredDate}</td></tr>` : ""}
          ${booking.preferredTime ? `<tr><td style="padding:6px 0;color:#888">Time</td><td style="padding:6px 0">${booking.preferredTime}</td></tr>` : ""}
        </table>
        ${booking.notes ? `<p style="margin:16px 0 0;font-size:14px"><strong>Notes:</strong> ${booking.notes}</p>` : ""}
        <p style="color:#888;font-size:12px;margin:20px 0 0">Reply directly to the visitor to confirm.</p>
      </div>`,
  });
}

export interface BookingConfirmation {
  visitorName: string;
  slotLabel: string;
  service?: string;
  sitePhone?: string;
}

export async function sendBookingConfirmation(
  to: string,
  siteName: string,
  booking: BookingConfirmation
): Promise<void> {
  const config = getEmailConfig();
  const lines = [
    `Hi ${booking.visitorName},`,
    "",
    `Your appointment with ${siteName} is booked for ${booking.slotLabel}.`,
    booking.service ? `Service: ${booking.service}` : null,
    booking.sitePhone ? `Questions? Call ${booking.sitePhone}` : null,
    "",
    `— ${siteName}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (!config) {
    console.log(`\n[${PRODUCT_NAME}] DEV booking confirmation to ${to}:\n${lines}\n`);
    return;
  }

  await config.transporter.sendMail({
    from: `${PRODUCT_NAME} <${config.from}>`,
    to,
    subject: `Appointment confirmed — ${siteName}`,
    text: lines,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px;font-size:18px">Appointment confirmed</h2>
        <p style="color:#555;margin:0 0 16px">Hi ${booking.visitorName}, your booking with <strong>${siteName}</strong> is set.</p>
        <p style="font-size:15px;margin:0 0 8px"><strong>${booking.slotLabel}</strong></p>
        ${booking.service ? `<p style="font-size:14px;color:#555;margin:0 0 8px">Service: ${booking.service}</p>` : ""}
        ${booking.sitePhone ? `<p style="font-size:13px;color:#888;margin:16px 0 0">Questions? Call ${booking.sitePhone}</p>` : ""}
      </div>`,
  });
}

export interface BillingReminder {
  period: "monthly" | "annual";
  chargeAt: number;
}

function formatBillingDate(value: number): string {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export interface BillingActivatedEmail {
  period: "monthly" | "annual";
  chargeAt?: number;
}

export async function sendBillingActivatedEmail(
  to: string,
  details: BillingActivatedEmail
): Promise<void> {
  const config = getEmailConfig();
  const periodLabel = details.period === "annual" ? "annual" : "monthly";
  const nextCharge = details.chargeAt ? formatBillingDate(details.chargeAt) : null;
  const lines = [
    `Your ${PRODUCT_NAME} Basic ${periodLabel} plan is now active.`,
    nextCharge ? `Next payment due: ${nextCharge}` : null,
    "",
    "You can manage your subscription any time from the Billing page in your dashboard.",
  ]
    .filter(Boolean)
    .join("\n");

  if (!config) {
    console.log(`\n[${PRODUCT_NAME}] DEV billing activation to ${to}:\n${lines}\n`);
    return;
  }

  await config.transporter.sendMail({
    from: `${PRODUCT_NAME} <${config.from}>`,
    to,
    subject: `${PRODUCT_NAME} Basic is active`,
    text: lines,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px;font-size:18px">Your Basic plan is active</h2>
        <p style="color:#555;margin:0 0 16px">
          Your <strong>${PRODUCT_NAME} Basic</strong> ${periodLabel} subscription is now live.
        </p>
        ${nextCharge ? `<p style="color:#555;margin:0 0 16px">Next payment due: <strong>${nextCharge}</strong></p>` : ""}
        <p style="color:#555;margin:0">You can manage your subscription from the Billing page in your dashboard.</p>
      </div>`,
  });
}

export interface BillingCancellationScheduledEmail {
  endsAt?: number;
}

export async function sendBillingCancellationScheduledEmail(
  to: string,
  details: BillingCancellationScheduledEmail
): Promise<void> {
  const config = getEmailConfig();
  const endsAt = details.endsAt ? formatBillingDate(details.endsAt) : null;
  const lines = [
    `Your ${PRODUCT_NAME} Basic subscription will cancel at the end of the current cycle.`,
    endsAt ? `Access ends on: ${endsAt}` : null,
    "",
    "You will keep all Basic features until the cycle finishes.",
  ]
    .filter(Boolean)
    .join("\n");

  if (!config) {
    console.log(`\n[${PRODUCT_NAME}] DEV cancellation scheduled to ${to}:\n${lines}\n`);
    return;
  }

  await config.transporter.sendMail({
    from: `${PRODUCT_NAME} <${config.from}>`,
    to,
    subject: `${PRODUCT_NAME} cancellation scheduled`,
    text: lines,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px;font-size:18px">Cancellation scheduled</h2>
        <p style="color:#555;margin:0 0 16px">
          Your <strong>${PRODUCT_NAME} Basic</strong> subscription will stay active until the end of your current billing cycle.
        </p>
        ${endsAt ? `<p style="color:#555;margin:0"><strong>Ends on ${endsAt}</strong></p>` : ""}
      </div>`,
  });
}

export interface BillingStoppedEmail {
  reason: "cancelled" | "halted";
  endedAt?: number;
}

export async function sendBillingStoppedEmail(
  to: string,
  details: BillingStoppedEmail
): Promise<void> {
  const config = getEmailConfig();
  const endedAt = details.endedAt ? formatBillingDate(details.endedAt) : null;
  const reasonLabel =
    details.reason === "halted"
      ? "has been halted and your account is now on the Free plan"
      : "has ended and your account is now on the Free plan";
  const lines = [
    `Your ${PRODUCT_NAME} Basic subscription ${reasonLabel}.`,
    endedAt ? `Updated on: ${endedAt}` : null,
    "",
    "You can restart Basic any time from the Billing page in your dashboard.",
  ]
    .filter(Boolean)
    .join("\n");

  if (!config) {
    console.log(`\n[${PRODUCT_NAME}] DEV billing stopped to ${to}:\n${lines}\n`);
    return;
  }

  await config.transporter.sendMail({
    from: `${PRODUCT_NAME} <${config.from}>`,
    to,
    subject:
      details.reason === "halted"
        ? `${PRODUCT_NAME} subscription halted`
        : `${PRODUCT_NAME} subscription ended`,
    text: lines,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px;font-size:18px">
          ${details.reason === "halted" ? "Subscription halted" : "Subscription ended"}
        </h2>
        <p style="color:#555;margin:0 0 16px">
          Your <strong>${PRODUCT_NAME} Basic</strong> subscription ${reasonLabel}.
        </p>
        ${endedAt ? `<p style="color:#555;margin:0 0 16px">Updated on <strong>${endedAt}</strong>.</p>` : ""}
        <p style="color:#555;margin:0">You can restart Basic any time from the Billing page in your dashboard.</p>
      </div>`,
  });
}

export async function sendBillingRenewalReminder(
  to: string,
  reminder: BillingReminder
): Promise<void> {
  const config = getEmailConfig();
  const due = formatBillingDate(reminder.chargeAt);
  const periodLabel = reminder.period === "annual" ? "annual" : "monthly";
  const lines = [
    `Your ${PRODUCT_NAME} Basic ${periodLabel} renewal is due on ${due}.`,
    "",
    "You can manage or cancel your subscription from the Billing page in your dashboard.",
  ].join("\n");

  if (!config) {
    console.log(`\n[${PRODUCT_NAME}] DEV billing reminder to ${to}:\n${lines}\n`);
    return;
  }

  await config.transporter.sendMail({
    from: `${PRODUCT_NAME} <${config.from}>`,
    to,
    subject: `${PRODUCT_NAME} renewal reminder`,
    text: lines,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px;font-size:18px">Your renewal is coming up</h2>
        <p style="color:#555;margin:0 0 16px">
          Your <strong>${PRODUCT_NAME} Basic</strong> ${periodLabel} subscription renews on
          <strong> ${due}</strong>.
        </p>
        <p style="color:#555;margin:0 0 16px">
          If you want to stop auto-renewal, open the Billing page in your dashboard and use
          <strong> Cancel at period end</strong>.
        </p>
      </div>`,
  });
}

function emailShell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#11130f">
      <p style="margin:0 0 20px;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#214f43">${PRODUCT_NAME}</p>
      <h2 style="margin:0 0 12px;font-size:22px;line-height:1.25">${title}</h2>
      ${bodyHtml}
      <p style="color:#888;font-size:12px;margin:28px 0 0;line-height:1.6">
        You received this because you use ${PRODUCT_NAME}. Reply if you need help — we're happy to guide you.
      </p>
    </div>`;
}

function emailButton(href: string, label: string): string {
  return `<p style="margin:20px 0 0"><a href="${href}" style="display:inline-block;background:#214f43;color:#fff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:999px">${label}</a></p>`;
}

export interface WelcomeEmailDetails {
  dashboardUrl: string;
  createUrl: string;
}

export async function sendWelcomeEmail(
  to: string,
  details: WelcomeEmailDetails
): Promise<void> {
  const config = getEmailConfig();
  const lines = [
    `Welcome to ${PRODUCT_NAME}.`,
    "",
    "Here's how to get started:",
    "1. Create your first site from the homepage",
    "2. Open My sites to edit, share, or connect a domain",
    "",
    `Create a site: ${details.createUrl}`,
    `My sites: ${details.dashboardUrl}`,
  ].join("\n");

  const body = `
    <p style="color:#555;margin:0 0 16px;line-height:1.65">
      Thanks for joining <strong>${PRODUCT_NAME}</strong>. You can turn a Google listing, resume,
      or a few answers into a polished website in minutes.
    </p>
    <ol style="color:#555;margin:0;padding-left:20px;line-height:1.8">
      <li>Search your business or paste a Google Maps link</li>
      <li>Review the draft and publish when you're happy</li>
      <li>Open <strong>My sites</strong> anytime to edit, share, or connect your domain</li>
    </ol>
    ${emailButton(details.createUrl, "Create your first site")}
    <p style="margin:16px 0 0"><a href="${details.dashboardUrl}" style="color:#214f43;font-weight:600">Go to My sites</a></p>`;

  if (!config) {
    console.log(`\n[${PRODUCT_NAME}] DEV welcome email to ${to}:\n${lines}\n`);
    return;
  }

  await config.transporter.sendMail({
    from: `${PRODUCT_NAME} <${config.from}>`,
    to,
    subject: `Welcome to ${PRODUCT_NAME}`,
    text: lines,
    html: emailShell("Welcome — let's build your first site", body),
  });
}

export interface SitePublishedEmailDetails {
  siteName: string;
  liveUrl: string;
  dashboardUrl: string;
  settingsUrl: string;
  pricingUrl: string;
  feedbackUrl?: string;
  subdomainNote?: string;
  onFreePlan: boolean;
}

export async function sendSitePublishedEmail(
  to: string,
  details: SitePublishedEmailDetails
): Promise<void> {
  const config = getEmailConfig();
  const feedbackUrl = details.feedbackUrl ?? details.dashboardUrl;
  const lines = [
    `Your site "${details.siteName}" is live.`,
    "",
    `Live URL: ${details.liveUrl}`,
    `My sites: ${details.dashboardUrl}`,
    "",
    "We'd love your feedback — reply to this email and tell us how building went (1–5 stars + anything confusing).",
    "",
    details.onFreePlan
      ? "Upgrade to Basic for custom domain, booking, and more sites."
      : "Open site settings to connect your custom domain or manage bookings.",
    "",
    details.subdomainNote ?? null,
  ]
    .filter(Boolean)
    .join("\n");

  const upgradeBlock = details.onFreePlan
    ? `
      <div style="margin:20px 0 0;padding:16px;border-radius:14px;background:#f4f7f5;border:1px solid #dce8e2">
        <p style="margin:0 0 8px;font-weight:600;color:#214f43">Want more from your site?</p>
        <p style="margin:0;color:#555;font-size:14px;line-height:1.6">
          Basic unlocks up to 5 sites, your own domain, email + WhatsApp booking, and no PaperChai branding.
        </p>
        ${emailButton(details.pricingUrl, "See Basic features")}
      </div>`
    : `
      <p style="color:#555;margin:16px 0 0;line-height:1.65">
        Connect your own domain from site settings — add the DNS records we show you, then verify.
      </p>`;

  const body = `
    <p style="color:#555;margin:0 0 16px;line-height:1.65">
      Thanks for creating <strong>${details.siteName}</strong> with ${PRODUCT_NAME}. Your site is live and ready to share.
    </p>
    <p style="margin:0;font-size:15px"><a href="${details.liveUrl}" style="color:#214f43;font-weight:600">${details.liveUrl}</a></p>
    ${details.subdomainNote ? `<p style="color:#666;font-size:13px;margin:12px 0 0;line-height:1.55">${details.subdomainNote}</p>` : ""}
    <ol style="color:#555;margin:16px 0 0;padding-left:20px;line-height:1.8">
      <li>Open your live site and share the link with customers</li>
      <li>Go to <strong>My sites</strong> to edit copy, photos, or theme</li>
      <li>In site settings, connect a custom domain when you're ready</li>
    </ol>
    ${emailButton(details.liveUrl, "View your live site")}
    <p style="margin:16px 0 0"><a href="${details.dashboardUrl}" style="color:#214f43;font-weight:600">Open My sites</a>
      · <a href="${details.settingsUrl}" style="color:#214f43;font-weight:600">Site settings &amp; DNS</a></p>
    <div style="margin:24px 0 0;padding:16px;border-radius:14px;background:#fff8e8;border:1px solid #eed9a3">
      <p style="margin:0 0 8px;font-weight:600;color:#7a5a12">Quick feedback?</p>
      <p style="margin:0;color:#555;font-size:14px;line-height:1.6">
        How was building your site? Hit reply and send a score from 1–5 plus anything that felt confusing.
        We read every reply.
      </p>
      <p style="margin:12px 0 0"><a href="${feedbackUrl}" style="color:#214f43;font-weight:600">Share feedback</a></p>
    </div>
    ${upgradeBlock}`;

  if (!config) {
    console.log(`\n[${PRODUCT_NAME}] DEV site published email to ${to}:\n${lines}\n`);
    return;
  }

  await config.transporter.sendMail({
    from: `${PRODUCT_NAME} <${config.from}>`,
    to,
    replyTo: config.from,
    subject: `Your site is live — ${details.siteName}`,
    text: lines,
    html: emailShell(`Thanks for building ${details.siteName}`, body),
  });
}

export interface UpgradeNudgeEmailDetails {
  dashboardUrl: string;
  pricingUrl: string;
  siteName?: string;
}

export async function sendUpgradeNudgeEmail(
  to: string,
  details: UpgradeNudgeEmailDetails
): Promise<void> {
  const config = getEmailConfig();
  const intro = details.siteName
    ? `You've started with ${details.siteName} on the Free plan.`
    : "You're on the Free plan.";
  const lines = [
    intro,
    "",
    "Basic adds custom domain, booking, more sites, and removes PaperChai branding.",
    "",
    `Upgrade: ${details.pricingUrl}`,
    `My sites: ${details.dashboardUrl}`,
  ].join("\n");

  const body = `
    <p style="color:#555;margin:0 0 16px;line-height:1.65">${intro}</p>
    <p style="color:#555;margin:0 0 16px;line-height:1.65">
      When you're ready to grow, <strong>Basic</strong> unlocks features customers expect from a real business site:
    </p>
    <ul style="color:#555;margin:0;padding-left:20px;line-height:1.8">
      <li>Connect your own domain (we show the DNS steps)</li>
      <li>Email + WhatsApp booking for enquiries</li>
      <li>Up to 5 sites and unlimited edits</li>
      <li>Remove PaperChai branding</li>
    </ul>
    ${emailButton(details.pricingUrl, "Upgrade to Basic")}
    <p style="margin:16px 0 0"><a href="${details.dashboardUrl}" style="color:#214f43;font-weight:600">Go to My sites</a></p>`;

  if (!config) {
    console.log(`\n[${PRODUCT_NAME}] DEV upgrade nudge to ${to}:\n${lines}\n`);
    return;
  }

  await config.transporter.sendMail({
    from: `${PRODUCT_NAME} <${config.from}>`,
    to,
    subject: `Unlock custom domain & booking on ${PRODUCT_NAME}`,
    text: lines,
    html: emailShell("Ready for the next step?", body),
  });
}
