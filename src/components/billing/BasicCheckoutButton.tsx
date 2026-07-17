"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trackPurchase, waitForBeacon } from "@/lib/analytics";
import { apiClient } from "@/platform/api/api-client";
import { invalidateServerQueries } from "@/platform/client-state/server-query-cache";
import { clientQueryKeys } from "@/platform/client-state/query-key-registry";

type BillingPeriod = "monthly" | "annual";
type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
type ButtonSize = "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";

type CheckoutPayload = {
  key: string;
  subscriptionId: string;
  name: string;
  description: string;
  prefill?: { email?: string };
  notes?: Record<string, string>;
};

type RazorpayCheckoutSuccess = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let checkoutScriptPromise: Promise<boolean> | null = null;

function loadCheckoutScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (checkoutScriptPromise) return checkoutScriptPromise;
  checkoutScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return checkoutScriptPromise;
}

export function BasicCheckoutButton({
  period,
  label,
  variant = "default",
  size = "lg",
  className,
  onSuccess,
  successHref = "/dashboard/billing/success",
}: {
  period: BillingPeriod;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  onSuccess?: () => void;
  /** Redirect here after verify succeeds. Pass `null` to stay on the page. */
  successHref?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const checkoutReady = await loadCheckoutScript();
      if (!checkoutReady || !window.Razorpay) {
        throw new Error("Could not load Razorpay Checkout.");
      }

      const data = await apiClient.post<CheckoutPayload>("/api/billing/checkout", {
        body: { period },
      });

      const checkout = new window.Razorpay({
        key: data.key,
        subscription_id: data.subscriptionId,
        name: data.name,
        description: data.description,
        prefill: data.prefill,
        notes: data.notes,
        theme: { color: "#111827" },
        handler: async (response: RazorpayCheckoutSuccess) => {
          try {
            await apiClient.post("/api/billing/verify", { body: response });
            invalidateServerQueries([
              clientQueryKeys.billing.prefix,
              clientQueryKeys.dashboard.prefix,
              clientQueryKeys.authentication.prefix,
            ]);
            await waitForBeacon((done) => {
              trackPurchase(
                {
                  period,
                  transaction_id: response.razorpay_payment_id,
                },
                { event_callback: done }
              );
            });
            setMessage("Basic plan activated.");
            onSuccess?.();
            if (successHref) {
              const params = new URLSearchParams({
                period,
                payment_id: response.razorpay_payment_id,
              });
              router.push(`${successHref}?${params.toString()}`);
            }
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Payment succeeded, but plan activation is pending."
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      checkout.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size={size}
        variant={variant}
        className={className}
        disabled={loading}
        onClick={() => void handleCheckout()}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {label ?? "Get Basic"}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
