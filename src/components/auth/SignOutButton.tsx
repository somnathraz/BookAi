"use client";

import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/platform/api/api-client";
import { clearAuthenticatedClientData } from "@/features/authentication/presentation/session-query";

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
    await apiClient.post("/api/auth/logout");
    clearAuthenticatedClientData();
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
  await apiClient.post("/api/auth/logout");
  clearAuthenticatedClientData();
}
