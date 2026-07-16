"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trackPurchase } from "@/lib/analytics";

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
}: {
  period: BillingPeriod;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  onSuccess?: () => void;
}) {
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

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<CheckoutPayload> & {
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout.");

      const checkout = new window.Razorpay({
        key: data.key,
        subscription_id: data.subscriptionId,
        name: data.name,
        description: data.description,
        prefill: data.prefill,
        notes: data.notes,
        theme: { color: "#111827" },
        handler: async (response: RazorpayCheckoutSuccess) => {
          const verify = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = (await verify.json().catch(() => ({}))) as { error?: string };
          if (!verify.ok) {
            setError(verifyData.error ?? "Payment succeeded, but plan activation is pending.");
            setLoading(false);
            return;
          }
          trackPurchase({
            period,
            transaction_id: response.razorpay_payment_id,
          });
          setMessage("Basic plan activated.");
          setLoading(false);
          onSuccess?.();
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
