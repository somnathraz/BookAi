"use client";

import Image from "next/image";
import Link from "next/link";

import { LOGO_PATH, PRODUCT_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Icon-only mark — nav, badges, footers. */
export function LogoMark({
  size = 28,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={LOGO_PATH}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 rounded-md object-contain", className)}
      aria-hidden
      priority={priority}
    />
  );
}

/** Logo mark + optional PaperChai wordmark. */
export function Logo({
  href = "/",
  size = 28,
  showWordmark = true,
  className,
  wordmarkClassName,
  onClick,
  priority = false,
}: {
  href?: string | null;
  size?: number;
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
  onClick?: () => void;
  priority?: boolean;
}) {
  const inner = (
    <>
      <Image
        src={LOGO_PATH}
        alt={`${PRODUCT_NAME} logo`}
        width={size}
        height={size}
        className="shrink-0 rounded-md object-contain"
        priority={priority}
      />
      {showWordmark ? (
        <span className={cn("font-semibold", wordmarkClassName)}>{PRODUCT_NAME}</span>
      ) : null}
    </>
  );

  const classes = cn("flex items-center gap-2", className);

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {inner}
      </Link>
    );
  }

  return <span className={classes}>{inner}</span>;
}
