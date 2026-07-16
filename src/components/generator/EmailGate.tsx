"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackSignUp } from "@/lib/analytics";

const EASE = [0.22, 1, 0.36, 1] as const;

export function EmailGate({
  onVerified,
  onBack,
  intent = "continue",
}: {
  onVerified: (email: string) => void;
  onBack: () => void;
  /** "continue" = verify before import; "generate" = legacy fallback at publish time */
  intent?: "continue" | "generate";
}) {
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delivered, setDelivered] = useState(true);
  const [devCode, setDevCode] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.status === 429 && data?.code === "rate_limited") {
        throw new Error(
          data.error ??
            "We're handling heavy traffic right now. Please try again in a few minutes."
        );
      }
      if (!res.ok) throw new Error(data?.error ?? "Couldn't send the code.");
      setDelivered(Boolean(data.delivered));
      setDevCode(data.devCode ?? null);
      setPhase("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Verification failed.");
      trackSignUp({ intent });
      onVerified(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex w-full min-w-0 flex-col gap-5"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to editor
      </button>

      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-card">
          {phase === "email" ? (
            <Mail className="size-5" />
          ) : (
            <ShieldCheck className="size-5" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-balance text-lg font-semibold sm:text-xl">
            {phase === "email"
              ? intent === "continue"
                ? "Verify your email to continue"
                : "Where should we send your site?"
              : "Enter your code"}
          </h2>
          <p className="mt-0.5 break-words text-sm text-muted-foreground">
            {phase === "email"
              ? intent === "continue"
                ? "One quick code before we import your data — your free plan includes one site."
                : "Verify your email to generate your site — your free plan includes one."
              : delivered
                ? `We sent a 6-digit code to ${email}.`
                : "Dev mode — no email configured. Use the code below."}
          </p>
        </div>
      </div>

      {phase === "email" ? (
        <form onSubmit={requestCode} className="flex flex-col gap-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoFocus
            required
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" size="lg" disabled={loading || !email.trim()}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending code…
              </>
            ) : (
              <>
                Send verification code
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="flex flex-col gap-4">
          {devCode ? (
            <button
              type="button"
              onClick={() => setCode(devCode)}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-200/90 transition-colors hover:bg-amber-500/15"
            >
              Dev code: <span className="font-mono font-semibold">{devCode}</span> — tap to fill
            </button>
          ) : null}
          <Input
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            autoFocus
            className="text-center text-2xl tracking-[0.5em]"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" size="lg" disabled={loading || code.length < 6}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                {intent === "continue" ? "Verify & continue" : "Verify & generate"}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
          <button
            type="button"
            onClick={() => {
              setPhase("email");
              setCode("");
              setError(null);
            }}
            className="text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Use a different email
          </button>
        </form>
      )}
    </motion.div>
  );
}
