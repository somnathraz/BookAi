import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { LEGAL_BRAND_NAME, LEGAL_LAST_UPDATED, getLegalContactEmail } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Cookie Policy",
  description:
    "How PaperChai uses essential cookies and similar technologies for sessions, preferences and service reliability.",
  path: "/cookies",
});

export default function CookiesPage() {
  const contactEmail = getLegalContactEmail();

  return (
    <LegalPage
      title="Cookie Policy"
      description={`This policy explains how ${LEGAL_BRAND_NAME} uses cookies and similar technologies.`}
      updated={LEGAL_LAST_UPDATED}
    >
      <LegalSection title="1. What are cookies">
        <p>
          Cookies are small text files stored on your device. Similar technologies may include
          local storage, session tokens and device identifiers used to remember settings or keep
          you signed in.
        </p>
      </LegalSection>

      <LegalSection title="2. How we use them">
        <p>We currently use essential cookies and similar technologies for core functionality, including:</p>
        <p>
          account verification and session management, remembering product state or preferences,
          fraud prevention, and improving reliability or debugging service issues.
        </p>
      </LegalSection>

      <LegalSection title="3. Analytics and marketing cookies">
        <p>
          As of this baseline policy, {LEGAL_BRAND_NAME} primarily relies on essential cookies
          needed to operate the service. If we introduce analytics, advertising or other optional
          cookies later, we may update this page and provide any additional controls or notices
          required by law.
        </p>
      </LegalSection>

      <LegalSection title="4. Managing cookies">
        <p>
          Most browsers allow you to control cookies through their settings. Blocking certain
          cookies may affect how the service works, especially sign-in, billing and dashboard
          features.
        </p>
      </LegalSection>

      <LegalSection title="5. Contact">
        <p>
          Questions about cookies or tracking technologies can be sent to{" "}
          <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
