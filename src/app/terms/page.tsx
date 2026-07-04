import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import {
  LEGAL_BRAND_NAME,
  LEGAL_GOVERNING_LAW,
  LEGAL_LAST_UPDATED,
  LEGAL_REFUND_WINDOW_DAYS,
  getLegalContactEmail,
} from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "Terms governing access to PaperChai, including subscriptions, acceptable use, payments, and liability limits.",
  path: "/terms",
});

export default function TermsPage() {
  const contactEmail = getLegalContactEmail();

  return (
    <LegalPage
      title="Terms of Service"
      description={`These terms govern your access to and use of ${LEGAL_BRAND_NAME}. By using the service, you agree to these terms.`}
      updated={LEGAL_LAST_UPDATED}
    >
      <LegalSection title="1. Service overview">
        <p>
          {LEGAL_BRAND_NAME} helps users create, publish, edit and manage one-page websites,
          bookings and related business content. Features may change over time, and some features
          are available only on paid plans.
        </p>
      </LegalSection>

      <LegalSection title="2. Accounts and eligibility">
        <p>
          You must provide accurate information when using the service and keep your email access
          secure. You are responsible for activity that occurs through your account or verified
          email session.
        </p>
      </LegalSection>

      <LegalSection title="3. Your content">
        <p>
          You retain ownership of the text, images, documents, contact details and other content
          you submit to {LEGAL_BRAND_NAME}. You give us a limited right to host, process, format,
          display and transmit that content only as needed to operate the service.
        </p>
        <p>
          You are responsible for ensuring that your content is lawful, accurate, and that you
          have the rights required to upload, publish or use it.
        </p>
      </LegalSection>

      <LegalSection title="4. Acceptable use">
        <p>You may not use the service to:</p>
        <p>
          violate law or third-party rights, publish fraudulent or deceptive material, distribute
          malware, attempt unauthorized access, abuse the booking system, send spam, or interfere
          with the reliability or security of the platform.
        </p>
      </LegalSection>

      <LegalSection title="5. Plans, billing and payment terms">
        <p>
          Paid subscriptions renew automatically until cancelled. Charges are processed through our
          payment provider, Razorpay, using the billing cycle shown at checkout and in your billing
          page.
        </p>
        <p>
          By purchasing a paid plan, you authorize recurring charges for the selected subscription
          period until you cancel. Pricing, taxes and included features may change prospectively,
          and any material changes will apply on a future billing cycle.
        </p>
      </LegalSection>

      <LegalSection title="6. Cancellation and refunds">
        <p>
          You can cancel a paid subscription from the billing page. Cancellation stops future
          renewals at the end of the current billing cycle unless the payment provider or law
          requires a different result.
        </p>
        <p>
          Refunds are governed by our Refund & Cancellation Policy. As a baseline policy, refund
          requests made within {LEGAL_REFUND_WINDOW_DAYS} calendar days of the charge date may be
          considered. After that period, fees are non-refundable except where required by law.
        </p>
      </LegalSection>

      <LegalSection title="7. Intellectual property">
        <p>
          The software, branding, workflows, interface elements and platform materials of{" "}
          {LEGAL_BRAND_NAME} are owned by or licensed to us and are protected by applicable
          intellectual property laws. These terms do not transfer ownership of our product or brand
          assets to you.
        </p>
      </LegalSection>

      <LegalSection title="8. Availability and disclaimers">
        <p>
          The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We
          do not guarantee uninterrupted availability, error-free operation, specific business
          outcomes, ranking improvements, lead volume, or compatibility with every third-party
          service.
        </p>
      </LegalSection>

      <LegalSection title="9. Limitation of liability">
        <p>
          To the maximum extent permitted by law, {LEGAL_BRAND_NAME} will not be liable for
          indirect, incidental, special, consequential or punitive damages, or for loss of profits,
          revenue, data, goodwill or business opportunity arising from the use of the service.
        </p>
        <p>
          Our aggregate liability for claims relating to the service will not exceed the amount you
          paid to us for the service in the 12 months before the event giving rise to the claim.
        </p>
      </LegalSection>

      <LegalSection title="10. Suspension and termination">
        <p>
          We may suspend or terminate access if you materially breach these terms, misuse the
          platform, create risk for other users, or where required for legal, security or payment
          reasons.
        </p>
      </LegalSection>

      <LegalSection title="11. Governing law and contact">
        <p>
          These terms are governed by the laws of {LEGAL_GOVERNING_LAW}, without regard to conflict
          of law principles.
        </p>
        <p>
          Questions about these terms can be sent to{" "}
          <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
