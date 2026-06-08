"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dispatchStudioReset, STUDIO_CREATE_HREF } from "@/lib/studio-reset";

export function CreateSiteLink({
  children,
  className,
  onNavigate,
}: {
  children: React.ReactNode;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    onNavigate?.();
    // On the homepage, Link href="/" is a no-op — reset the builder in place.
    if (pathname === "/") {
      e.preventDefault();
      dispatchStudioReset();
    }
  }

  return (
    <Link href={STUDIO_CREATE_HREF} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
