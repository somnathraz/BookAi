// Server-only multi-provider AI abstraction. Uses fetch (no SDKs) so adding a
// provider is just another branch. Keys come from env today; per-user BYOK can
// layer on top later by passing an override key into complete().

import "server-only";

export type ProviderId = "anthropic" | "google" | "openai";

interface ProviderConfig {
  id: ProviderId;
  label: string;
  envKey: string;
  defaultModel: string;
  modelEnvKey: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "anthropic",
    label: "Claude",
    envKey: "ANTHROPIC_API_KEY",
    defaultModel: "claude-haiku-4-5-20251001",
    modelEnvKey: "ANTHROPIC_MODEL",
  },
  {
    id: "google",
    label: "Gemini",
    envKey: "GEMINI_API_KEY",
    defaultModel: "gemini-2.0-flash",
    modelEnvKey: "GEMINI_MODEL",
  },
  {
    id: "openai",
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    defaultModel: "gpt-4o-mini",
    modelEnvKey: "OPENAI_MODEL",
  },
];

function keyFor(p: ProviderConfig): string | undefined {
  const v = process.env[p.envKey];
  return v && v.trim() ? v.trim() : undefined;
}

function configFor(id: ProviderId): ProviderConfig {
  const c = PROVIDERS.find((p) => p.id === id);
  if (!c) throw new Error(`Unknown provider: ${id}`);
  return c;
}

export function listConfiguredProviders(): { id: ProviderId; label: string }[] {
  return PROVIDERS.filter(keyFor).map((p) => ({ id: p.id, label: p.label }));
}

export function getActiveProviderId(): ProviderId | null {
  const override = process.env.BOOKAI_AI_PROVIDER?.trim() as ProviderId | undefined;
  if (override) {
    const c = PROVIDERS.find((p) => p.id === override);
    if (c && keyFor(c)) return c.id;
  }
  const first = PROVIDERS.find(keyFor);
  return first ? first.id : null;
}

export function aiAvailable(): boolean {
  return getActiveProviderId() !== null;
}

export function googleAvailable(): boolean {
  const serp = process.env.SERP_API_KEY?.trim();
  const places = process.env.GOOGLE_PLACES_API_KEY?.trim();
  return Boolean(serp || places);
}

// Resolve email env with forgiving aliases (people name these differently).
export interface EmailEnv {
  from?: string;
  sesUser?: string;
  sesPass?: string;
  sesHost?: string;
  gmailUser?: string;
  gmailPass?: string;
}

function pick(...names: string[]): string | undefined {
  for (const n of names) {
    const v = process.env[n]?.trim();
    if (v) return v;
  }
  return undefined;
}

export function resolveEmailEnv(): EmailEnv {
  const region = pick("SES_REGION", "AWS_REGION");
  return {
    from: pick("EMAIL_FROM", "SES_FROM_EMAIL", "SES_FROM", "SES_SOURCE_EMAIL"),
    sesUser: pick("SES_SMTP_USER", "SES_USER"),
    sesPass: pick("SES_SMTP_PASSWORD", "SES_SMTP_PASS", "SES_PASSWORD"),
    sesHost: pick("SES_SMTP_HOST") || (region ? `email-smtp.${region}.amazonaws.com` : undefined),
    gmailUser: pick("GMAIL_USER"),
    gmailPass: pick("GMAIL_APP_PASSWORD", "GMAIL_PASS"),
  };
}

export function emailAvailable(): boolean {
  const e = resolveEmailEnv();
  const ses = Boolean(e.from && e.sesUser && e.sesPass && e.sesHost);
  const gmail = Boolean(e.gmailUser && e.gmailPass);
  return ses || gmail;
}

interface CompleteOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
}

export async function complete(
  prompt: string,
  opts: CompleteOptions = {}
): Promise<string> {
  const id = getActiveProviderId();
  if (!id) throw new Error("No AI provider configured.");
  const cfg = configFor(id);
  const key = keyFor(cfg)!;
  const model = process.env[cfg.modelEnvKey]?.trim() || cfg.defaultModel;
  const { system, maxTokens = 2048, temperature = 0.3, json = false } = opts;

  if (id === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        ...(system ? { system } : {}),
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return (data.content?.[0]?.text as string) ?? "";
  }

  if (id === "google") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          ...(json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    });
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return (data.candidates?.[0]?.content?.parts?.[0]?.text as string) ?? "";
  }

  // openai
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content as string) ?? "";
}

export async function completeJSON<T>(
  prompt: string,
  opts: CompleteOptions = {}
): Promise<T> {
  const raw = await complete(prompt, { ...opts, json: true });
  return parseJsonLoose<T>(raw);
}

function parseJsonLoose<T>(raw: string): T {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    }
    throw new Error("AI did not return valid JSON.");
  }
}
