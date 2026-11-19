import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "motion"],
  },
  compress: true,
  // Blog posts whose slug carried the old PaperChai brand.
  async redirects() {
    return [
      { source: "/blog/paperchai-block-holiday-booking-dates-india", destination: "/blog/kritvani-block-holiday-booking-dates-india", permanent: true },
      { source: "/blog/paperchai-custom-domain-launch-checklist-local-business-india", destination: "/blog/kritvani-custom-domain-launch-checklist-local-business-india", permanent: true },
      { source: "/blog/paperchai-diwali-enquiry-cutoff-workflow-india", destination: "/blog/kritvani-diwali-enquiry-cutoff-workflow-india", permanent: true },
      { source: "/blog/paperchai-diwali-website-refresh-workflow-india", destination: "/blog/kritvani-diwali-website-refresh-workflow-india", permanent: true },
      { source: "/blog/paperchai-google-maps-service-area-website-workflow-india", destination: "/blog/kritvani-google-maps-service-area-website-workflow-india", permanent: true },
      { source: "/blog/paperchai-google-reviews-website-proof-workflow-india", destination: "/blog/kritvani-google-reviews-website-proof-workflow-india", permanent: true },
      { source: "/blog/paperchai-local-service-website-brief-workflow-india", destination: "/blog/kritvani-local-service-website-brief-workflow-india", permanent: true },
      { source: "/blog/paperchai-manage-website-appointment-requests-india", destination: "/blog/kritvani-manage-website-appointment-requests-india", permanent: true },
      { source: "/blog/paperchai-resume-to-portfolio-website-workflow-india", destination: "/blog/kritvani-resume-to-portfolio-website-workflow-india", permanent: true },
      { source: "/blog/paperchai-website-qr-code-workflow-local-service-india", destination: "/blog/kritvani-website-qr-code-workflow-local-service-india", permanent: true },
    ];
  },
};

export default nextConfig;
