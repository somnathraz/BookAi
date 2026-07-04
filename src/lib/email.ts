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
