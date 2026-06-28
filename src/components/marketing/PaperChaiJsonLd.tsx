import { LOGO_PATH, PRODUCT_NAME } from "@/lib/brand";
import { DEFAULT_DESCRIPTION } from "@/lib/seo";
import { getAppBaseUrl } from "@/lib/site-url";

/** Organization + WebSite schema for PaperChai marketing pages. */
export function PaperChaiJsonLd() {
  const url = getAppBaseUrl();
  const graph = [
    {
      "@type": "Organization",
      name: PRODUCT_NAME,
      url,
      logo: `${url}${LOGO_PATH}`,
      description: DEFAULT_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      name: PRODUCT_NAME,
      url,
      description: DEFAULT_DESCRIPTION,
      publisher: { "@type": "Organization", name: PRODUCT_NAME },
    },
    {
      "@type": "SoftwareApplication",
      name: PRODUCT_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url,
      description: DEFAULT_DESCRIPTION,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        description: "One free AI-generated site",
      },
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
