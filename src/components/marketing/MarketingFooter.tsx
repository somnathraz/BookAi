import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <span>© {new Date().getFullYear()} BookAi</span>
        <nav className="flex items-center gap-6">
          <Link href="/" className="transition-colors hover:text-foreground">
            Create a site
          </Link>
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
    </footer>
  );
}
