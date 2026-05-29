import Link from "next/link";
import { LayoutGrid, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "My sites" },
];

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
            <Sparkles className="size-4" />
          </span>
          BookAi
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/dashboard">
              <LayoutGrid className="size-4" />
              My sites
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/">Create a site</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
