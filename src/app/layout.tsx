import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";

import { LOGO_PATH, PRODUCT_NAME } from "@/lib/brand";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_KEYWORDS,
  getMetadataBase,
} from "@/lib/seo";
import { getAppBaseUrl } from "@/lib/site-url";
import { GoogleAnalytics } from "@/components/google-analytics";
import { MicrosoftClarity } from "@/components/microsoft-clarity";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const newsreader = Newsreader({
  variable: "--font-editorial",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: DEFAULT_TITLE,
    template: `%s — ${PRODUCT_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: PRODUCT_NAME,
  authors: [{ name: PRODUCT_NAME, url: getAppBaseUrl() }],
  creator: PRODUCT_NAME,
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: PRODUCT_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: DEFAULT_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/opengraph-image.png"],
  },
  icons: {
    icon: LOGO_PATH,
    apple: LOGO_PATH,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <GoogleAnalytics />
          <MicrosoftClarity />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
