import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import {
  LEGAL_LAST_UPDATED,
  LEGAL_REFUND_WINDOW_DAYS,
  getLegalContactEmail,
} from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Refund & Cancellation Policy",
  description:
    "PaperChai's baseline subscription cancellation and 7-day refund policy for Basic plan charges.",
  path: "/refunds",
});

export default function RefundsPage() {
  const contactEmail = getLegalContactEmail();

  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      description="This page explains how subscription cancellations and refund requests are handled for paid plans."
      updated={LEGAL_LAST_UPDATED}
    >
      <LegalSection title="1. Cancellation">
        <p>
          You can cancel a paid subscription from the billing page. Cancellation stops automatic
          renewal at the end of the active billing cycle. Your paid features remain available until
          that cycle ends unless we are required to suspend service earlier for legal, security or
          abuse-related reasons.
        </p>
      </LegalSection>

      <LegalSection title="2. Refund window">
        <p>
          As a baseline policy, refund requests may be made within {LEGAL_REFUND_WINDOW_DAYS}{" "}
          calendar days of the relevant subscription charge date, including an initial payment or a
          renewal payment.
        </p>
        <p>
          After that window, charges are non-refundable except where required by applicable law.
        </p>
      </LegalSection>

      <LegalSection title="3. Non-refundable items">
        <p>
          Partial billing periods, unused time, and cancellations made after the refund window are
          generally not eligible for pro-rated refunds unless required by law or approved as an
          exception.
        </p>
      </LegalSection>

      <LegalSection title="4. How to request a refund">
        <p>
          Email your refund request to{" "}
          <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>{" "}
          from the same email address used for your account or billing communication. Include your
          account email and the approximate charge date so we can review the request.
        </p>
      </LegalSection>

      <LegalSection title="5. Processing">
        <p>
          If a refund is approved, it will typically be returned to the original payment method.
          Processing timelines depend on Razorpay and the payment method used.
        </p>
      </LegalSection>

      <LegalSection title="6. Chargebacks and disputes">
        <p>
          If you believe a charge is unauthorized, please contact us first at{" "}
          <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          . We may request information needed to investigate the billing issue.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
