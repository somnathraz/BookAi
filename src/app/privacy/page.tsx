import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { LEGAL_BRAND_NAME, LEGAL_LAST_UPDATED, getLegalContactEmail } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How PaperChai collects, uses, stores and shares personal data for accounts, sites, bookings and billing.",
  path: "/privacy",
});

export default function PrivacyPage() {
  const contactEmail = getLegalContactEmail();

  return (
    <LegalPage
      title="Privacy Policy"
      description={`This policy explains what information ${LEGAL_BRAND_NAME} collects, how we use it, and the choices available to you.`}
      updated={LEGAL_LAST_UPDATED}
    >
      <LegalSection title="1. Information we collect">
        <p>We may collect:</p>
        <p>
          account information such as your email address; content you upload or paste such as
          resumes, business details, links, images and site copy; booking details submitted by your
          customers; billing and subscription metadata; and technical data such as logs, IP
          address, browser information and session identifiers.
        </p>
      </LegalSection>

      <LegalSection title="2. How we use information">
        <p>We use personal data to operate and improve the service, including to:</p>
        <p>
          create and host websites, verify accounts, process subscriptions, send transactional
          emails, power bookings, prevent abuse, diagnose performance issues, and comply with legal
          or payment obligations.
        </p>
      </LegalSection>

      <LegalSection title="3. AI processing and imports">
        <p>
          If you submit documents, links or profile data for import, that information may be
          processed by our configured AI and extraction providers to generate site content and
          structured business data.
        </p>
      </LegalSection>

      <LegalSection title="4. Payments">
        <p>
          Subscription payments are processed by Razorpay. We do not store full card or bank
          details on our servers. We may store payment-related metadata such as subscription ID,
          billing status, billing cycle dates and reminder timestamps.
        </p>
      </LegalSection>

      <LegalSection title="5. How we share data">
        <p>
          We may share information with service providers that help us run the platform, such as
          hosting providers, email providers, AI providers, payment processors, and infrastructure
          or security tools. We may also disclose information when required by law or to protect
          users, our service or our rights.
        </p>
      </LegalSection>

      <LegalSection title="6. Retention">
        <p>
          We keep information for as long as reasonably necessary to provide the service, comply
          with legal obligations, resolve disputes, enforce agreements and maintain security or
          backups. Retention periods may vary by data type.
        </p>
      </LegalSection>

      <LegalSection title="7. Your choices and rights">
        <p>
          Depending on applicable law, you may have rights to access, correct, delete or export
          your personal data, or to object to certain processing. To make a request, contact us at{" "}
          <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="8. Security">
        <p>
          We use reasonable administrative, technical and organizational measures to protect
          information. No system is completely secure, so we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>
          {LEGAL_BRAND_NAME} is not intended for children under 18, and we do not knowingly
          collect personal data from children in a manner that requires parental consent.
        </p>
      </LegalSection>

      <LegalSection title="10. Policy updates and contact">
        <p>
          We may update this policy from time to time. If we make material changes, we may update
          the date on this page and provide additional notice where appropriate.
        </p>
        <p>
          Privacy questions can be sent to{" "}
          <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
