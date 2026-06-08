import Link from "next/link";

import { CreateSiteLink } from "@/components/marketing/CreateSiteLink";
import { CUSTOM_SITE_HOST, CUSTOM_SITE_URL, PRODUCT_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function CustomSiteLink({ className }: { className?: string }) {
  return (
    <a
      href={CUSTOM_SITE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-xs text-muted-foreground transition-colors hover:text-foreground",
        className
      )}
    >
      Need a custom site?{" "}
      <span className="underline underline-offset-2">{CUSTOM_SITE_HOST}</span>
    </a>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-8 sm:items-stretch">
        <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} {PRODUCT_NAME}</span>
          <CustomSiteLink />
          <nav className="flex flex-wrap items-center justify-center gap-6">
            <CreateSiteLink className="transition-colors hover:text-foreground">
              Create a site
            </CreateSiteLink>
            <Link href="/pricing" className="transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link href="/about" className="transition-colors hover:text-foreground">
              About
            </Link>
            <Link href="/dashboard" className="transition-colors hover:text-foreground">
              My sites
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export function GeneratedSiteFooter({
  ownerName,
  className,
}: {
  ownerName: string;
  className?: string;
}) {
  return (
    <footer
      className={cn(
        "mt-10 flex flex-col items-center gap-2 border-t pt-8 text-sm text-muted-foreground sm:flex-row sm:justify-between",
        className
      )}
    >
      <span>© {new Date().getFullYear()} {ownerName}</span>
      <div className="flex flex-col items-center gap-1.5 sm:items-end">
        <span className="text-xs">Built with {PRODUCT_NAME}</span>
        <CustomSiteLink />
      </div>
    </footer>
  );
}
