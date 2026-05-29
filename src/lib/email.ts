import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

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
    console.log(`\n[BookAi] DEV verification code for ${to}: ${code}\n`);
    return;
  }
  await config.transporter.sendMail({
    from: `BookAi <${config.from}>`,
    to,
    subject: `${code} is your BookAi verification code`,
    text: `Your BookAi verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:420px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px;font-size:18px">Verify your email</h2>
        <p style="color:#555;margin:0 0 20px">Enter this code in BookAi to start generating your site.</p>
        <div style="font-size:34px;font-weight:700;letter-spacing:8px;text-align:center;padding:16px;background:#f4f4f5;border-radius:12px">${code}</div>
        <p style="color:#888;font-size:13px;margin:20px 0 0">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div>`,
  });
}
