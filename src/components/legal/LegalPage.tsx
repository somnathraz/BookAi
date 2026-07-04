import Link from "next/link";

import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Badge } from "@/components/ui/badge";

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refunds", label: "Refunds" },
  { href: "/cookies", label: "Cookies" },
];

export function LegalPage({
  title,
  description,
  updated,
  children,
}: {
  title: string;
  description: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col">
      <MarketingNav />
      <section className="mx-auto w-full max-w-4xl px-6 pb-16 pt-16 sm:pt-24">
        <Badge variant="secondary" className="mb-6 rounded-full px-3 py-1">
          Legal
        </Badge>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-pretty text-lg text-muted-foreground">
          {description}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: {updated}</p>

        <nav className="mt-8 flex flex-wrap gap-3 text-sm">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <article className="mt-10 space-y-8">{children}</article>
      </section>
      <div className="mt-auto">
        <MarketingFooter />
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card/50 p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
