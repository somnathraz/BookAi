"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/platform/api/api-client";

interface DomainState {
  domain?: string;
  verified: boolean;
  verifyToken?: string;
  txtHost?: string | null;
  cnameTarget?: string | null;
}

export function CustomDomainPanel({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [input, setInput] = useState("");
  const [state, setState] = useState<DomainState>({ verified: false });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<DomainState>(`/api/sites/${encodeURIComponent(siteId)}/domain`);
      setState(data);
      setInput(data.domain ?? "");
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveDomain() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const data = await apiClient.patch<DomainState>(`/api/sites/${encodeURIComponent(siteId)}/domain`, {
        body: { domain: input },
      });
      setState(data);
      setMessage("Domain saved. Add the DNS records below, then verify.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function verifyDomain() {
    setVerifying(true);
    setMessage(null);
    setError(null);
    try {
      const data = await apiClient.post<DomainState>(`/api/sites/${encodeURIComponent(siteId)}/domain`);
      setState(data);
      setMessage("Domain verified. Your site is live on your domain.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  async function clearDomain() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const data = await apiClient.patch<DomainState>(`/api/sites/${encodeURIComponent(siteId)}/domain`, {
        body: { clear: true },
      });
      setState(data);
      setInput("");
      setMessage("Custom domain removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading domain…
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card/60 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Custom domain</h2>
          <p className="text-sm text-muted-foreground">
            Connect your own domain (Basic). Visitors see your brand, not a PaperChai URL.
          </p>
        </div>
        {state.verified ? (
          <Badge className="gap-1">
            <Check className="size-3" />
            Verified
          </Badge>
        ) : state.domain ? (
          <Badge variant="secondary">Pending verification</Badge>
        ) : null}
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Your domain</span>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="example.com"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void saveDomain()} disabled={saving || !input.trim()}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save domain
        </Button>
        {state.domain && !state.verified ? (
          <Button variant="secondary" onClick={() => void verifyDomain()} disabled={verifying}>
            {verifying ? <Loader2 className="size-4 animate-spin" /> : null}
            Check DNS
          </Button>
        ) : null}
        {state.domain ? (
          <Button variant="outline" onClick={() => void clearDomain()} disabled={saving}>
            Remove
          </Button>
        ) : null}
      </div>

      {state.domain && state.verifyToken ? (
        <div className="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm">
          <p className="font-medium">DNS setup</p>
          <ol className="list-decimal space-y-3 pl-5 text-muted-foreground">
            <li>
              <span className="text-foreground">TXT</span> — host{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                {state.txtHost ?? `_paperchai-verification.${state.domain}`}
              </code>
              <br />
              value{" "}
              <code className="break-all rounded bg-muted px-1 py-0.5 text-xs">
                {state.verifyToken}
              </code>
            </li>
            {state.cnameTarget ? (
              <li>
                <span className="text-foreground">CNAME</span> — host{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">www</code> →{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">{state.cnameTarget}</code>
              </li>
            ) : null}
            <li>
              Add <code className="rounded bg-muted px-1 py-0.5 text-xs">www.{state.domain}</code>{" "}
              to your Vercel project domains (Settings → Domains) after verification.
            </li>
          </ol>
        </div>
      ) : null}

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
