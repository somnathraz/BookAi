"use client";

import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SignOutButton({
  onSignedOut,
  className,
  label = "Sign out",
}: {
  onSignedOut?: () => void;
  className?: string;
  label?: string;
}) {
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    onSignedOut?.();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("text-muted-foreground hover:text-foreground", className)}
      onClick={() => void signOut()}
    >
      <LogOut className="size-3.5" />
      {label}
    </Button>
  );
}

export async function signOutSession(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}
