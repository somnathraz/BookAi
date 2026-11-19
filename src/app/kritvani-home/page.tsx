import type { Metadata } from "next";
import Image from "next/image";

import { BRAND_DOMAIN, LOGO_PATH } from "@/lib/brand";

// Served at https://kritvani.com/ — proxy.ts rewrites the bare company domain
// here. Products live on subdomains; this page just points to them.

const BRAND_URL = `https://${BRAND_DOMAIN}`;

const products = [
  {
    name: "Kritvani Builder",
    href: `https://builder.${BRAND_DOMAIN}`,
    host: `builder.${BRAND_DOMAIN}`,
    description:
      "Turn your business details into a booking-ready website in minutes.",
  },
  {
    name: "PaperChai",
    href: `https://paperchai.${BRAND_DOMAIN}`,
    host: `paperchai.${BRAND_DOMAIN}`,
    description:
      "GST-ready invoices, payment reminders and client billing for freelancers and small teams.",
  },
];

export const metadata: Metadata = {
  title: { absolute: "Kritvani — software for Indian small businesses" },
  description:
    "Kritvani builds simple software for Indian small businesses: Kritvani Builder for websites and PaperChai for invoicing.",
  alternates: { canonical: BRAND_URL },
  openGraph: {
    url: BRAND_URL,
    siteName: "Kritvani",
    title: "Kritvani — software for Indian small businesses",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Kritvani",
  url: BRAND_URL,
  logo: `${BRAND_URL}${LOGO_PATH}`,
  email: `support@${BRAND_DOMAIN}`,
  areaServed: "IN",
};

export default function KritvaniHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-16 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <div className="flex items-center gap-3">
        <Image src={LOGO_PATH} alt="" width={40} height={40} priority />
        <span className="text-2xl font-semibold tracking-tight">Kritvani</span>
      </div>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Simple software for Indian small businesses.
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Everything we make lives on its own subdomain. Pick a product to get started.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <li key={p.host}>
            <a
              href={p.href}
              className="block h-full rounded-xl border border-border p-5 transition-colors hover:bg-muted"
            >
              <span className="text-lg font-medium">{p.name}</span>
              <span className="mt-1 block font-mono text-xs text-muted-foreground">{p.host}</span>
              <span className="mt-3 block text-sm text-muted-foreground">{p.description}</span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-12 text-sm text-muted-foreground">
        Questions?{" "}
        <a className="underline underline-offset-4" href={`mailto:support@${BRAND_DOMAIN}`}>
          support@{BRAND_DOMAIN}
        </a>
      </p>
    </main>
  );
}
