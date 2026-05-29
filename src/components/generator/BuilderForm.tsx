"use client";

import { useState } from "react";
import { Loader2, Moon, Sparkles, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/generator/PhotoUpload";
import { DOMAIN_PRESETS } from "@/lib/template";
import { deriveArchetype } from "@/lib/compose";
import type {
  Archetype,
  BusinessDomain,
  GeneratorInput,
  ThemeMode,
} from "@/lib/types";

const DOMAIN_OPTIONS = (
  Object.entries(DOMAIN_PRESETS) as [BusinessDomain, { label: string }][]
).map(([value, preset]) => ({ value, label: preset.label }));

// Keep these labels/blurbs in sync with AnalysisReveal — each maps 1:1 to the
// section ordering in lib/compose.ts.
const ARCHETYPE_OPTIONS: { id: Archetype; label: string; blurb: string }[] = [
  { id: "profile", label: "Personal profile", blurb: "About + experience timeline" },
  { id: "portfolio", label: "Portfolio", blurb: "Leads with your work" },
  { id: "business", label: "Business", blurb: "Services, photos & reviews" },
];

interface Row {
  a: string;
  b: string;
  c?: string;
}

function padRows(rows: Row[], min: number, empty: Row): Row[] {
  const out = [...rows];
  while (out.length < min) out.push({ ...empty });
  return out;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">
        {label}
        {hint ? (
          <span className="ml-2 font-normal text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

export function BuilderForm({
  onGenerate,
  generating,
  error,
  initialValues,
  aiAvailable = false,
  providerLabel,
}: {
  onGenerate: (input: GeneratorInput) => void;
  generating: boolean;
  error: string | null;
  initialValues?: Partial<GeneratorInput>;
  aiAvailable?: boolean;
  providerLabel?: string | null;
}) {
  const iv = initialValues ?? {};
  const [useAI, setUseAI] = useState(true);
  const [name, setName] = useState(iv.name ?? "");
  const [domain, setDomain] = useState<BusinessDomain>(iv.domain ?? "developer");
  const [archetype, setArchetype] = useState<Archetype>(
    iv.archetype ?? deriveArchetype(iv.domain ?? "developer")
  );
  const [theme, setTheme] = useState<ThemeMode>(iv.theme ?? "light");
  const [tagline, setTagline] = useState(iv.tagline ?? "");
  const [bio, setBio] = useState(iv.bio ?? "");
  const [location, setLocation] = useState(iv.location ?? "");
  const [email, setEmail] = useState(iv.email ?? "");
  const [phone, setPhone] = useState(iv.phone ?? "");
  const [photo, setPhoto] = useState<string | null>(iv.photo ?? null);
  const [whatsapp, setWhatsapp] = useState(iv.socials?.whatsapp ?? "");
  const [github, setGithub] = useState(iv.socials?.github ?? "");
  const [linkedin, setLinkedin] = useState(iv.socials?.linkedin ?? "");
  const [instagram, setInstagram] = useState(iv.socials?.instagram ?? "");
  const [website, setWebsite] = useState(iv.socials?.website ?? "");
  const [services, setServices] = useState<Row[]>(() =>
    padRows(
      (iv.services ?? []).map((s) => ({ a: s.title, b: s.description ?? "" })),
      3,
      { a: "", b: "" }
    )
  );
  const [testimonials, setTestimonials] = useState<Row[]>(() =>
    padRows(
      (iv.testimonials ?? []).map((t) => ({
        a: t.quote,
        b: t.author,
        c: t.role ?? "",
      })),
      2,
      { a: "", b: "", c: "" }
    )
  );

  function updateRow(
    rows: Row[],
    setRows: (r: Row[]) => void,
    i: number,
    key: keyof Row,
    value: string
  ) {
    const next = rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r));
    setRows(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || generating) return;

    const input: GeneratorInput = {
      name: name.trim(),
      domain,
      theme,
      tagline: tagline.trim() || undefined,
      bio: bio.trim() || undefined,
      location: location.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      services: services
        .filter((r) => r.a.trim())
        .map((r) => ({ title: r.a.trim(), description: r.b.trim() || undefined })),
      testimonials: testimonials
        .filter((r) => r.a.trim() && r.b.trim())
        .map((r) => {
          // Preserve the genuine rating / verified flag (e.g. Google reviews)
          // that the form doesn't expose, matching on the quote text.
          const orig = (iv.testimonials ?? []).find(
            (t) => t.quote.trim() === r.a.trim()
          );
          return {
            quote: r.a.trim(),
            author: r.b.trim(),
            role: r.c?.trim() || undefined,
            rating: orig?.rating,
            verified: orig?.verified,
          };
        }),
      accent: iv.accent,
      photo: photo ?? undefined,
      socials: {
        whatsapp: whatsapp.trim() || undefined,
        github: github.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        instagram: instagram.trim() || undefined,
        website: website.trim() || undefined,
      },
      archetype,
      gallery: archetype === "business" ? iv.gallery : [],
      // Pass through rich content extracted from the source that the form
      // doesn't edit yet — otherwise the experience timeline, projects, skills,
      // etc. would be silently dropped before generation.
      work: iv.work,
      projects: iv.projects,
      skills: iv.skills,
      certifications: iv.certifications,
      languages: iv.languages,
      interests: iv.interests,
      useAI: aiAvailable ? useAI : false,
    };
    onGenerate(input);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name or business" hint="required">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dr. Meera Rao, or Rao Dental Clinic"
            required
          />
        </Field>
        <Field label="What are you?">
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as BusinessDomain)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {DOMAIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-background">
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Site type"
        hint="decides the layout — profile/portfolio lead with experience & work; business leads with services"
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {ARCHETYPE_OPTIONS.map((opt) => {
            const active = archetype === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setArchetype(opt.id)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-md border p-2.5 text-left transition-colors",
                  active
                    ? "border-foreground bg-accent"
                    : "border-input hover:bg-accent/50"
                )}
              >
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.blurb}</span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Your photo" hint="optional — a headshot or logo, featured in the hero">
        <PhotoUpload value={photo} onChange={setPhoto} hint="JPG, PNG or WebP. We resize it for you." />
      </Field>

      <Field label="Theme" hint="minimal light by default; flip to dark anytime">
        <div className="flex gap-2">
          <ThemeChoice
            active={theme === "light"}
            onClick={() => setTheme("light")}
            icon={<Sun className="size-4" />}
            label="Light"
          />
          <ThemeChoice
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
            icon={<Moon className="size-4" />}
            label="Dark"
          />
        </div>
      </Field>

      <Field label="Tagline" hint="optional — we'll write one if you skip it">
        <Input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="One line that captures what you do"
        />
      </Field>

      <Field label="About you" hint="optional">
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A few sentences about you or your business"
          rows={3}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Location" hint="optional">
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Bengaluru, IN"
          />
        </Field>
        <Field label="Email" hint="optional">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
        </Field>
        <Field label="Phone" hint="optional">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 ..."
          />
        </Field>
      </div>

      <details className="rounded-lg border bg-card/40 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Contact &amp; social links{" "}
          <span className="font-normal text-muted-foreground">
            (optional — shown as buttons; WhatsApp defaults to your phone)
          </span>
        </summary>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="WhatsApp" hint="number or wa.me link">
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </Field>
          <Field label="Website">
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="yourdomain.com"
            />
          </Field>
          <Field label="GitHub">
            <Input
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="github.com/username"
            />
          </Field>
          <Field label="LinkedIn">
            <Input
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="linkedin.com/in/username"
            />
          </Field>
          <Field label="Instagram">
            <Input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="instagram.com/username"
            />
          </Field>
        </div>
      </details>

      <details
        open={Boolean(iv.services?.length || iv.testimonials?.length)}
        className="rounded-lg border bg-card/40 p-4"
      >
        <summary className="cursor-pointer text-sm font-medium">
          Add services & testimonials{" "}
          <span className="font-normal text-muted-foreground">
            (optional — we fill these from your profession if blank)
          </span>
        </summary>
        <div className="mt-4 flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium">Services</span>
            {services.map((row, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={row.a}
                  onChange={(e) =>
                    updateRow(services, setServices, i, "a", e.target.value)
                  }
                  placeholder={`Service ${i + 1} title`}
                />
                <Input
                  value={row.b}
                  onChange={(e) =>
                    updateRow(services, setServices, i, "b", e.target.value)
                  }
                  placeholder="Short description"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium">Testimonials</span>
            {testimonials.map((row, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <Input
                  value={row.a}
                  onChange={(e) =>
                    updateRow(testimonials, setTestimonials, i, "a", e.target.value)
                  }
                  placeholder={`Quote ${i + 1}`}
                />
                <Input
                  value={row.b}
                  onChange={(e) =>
                    updateRow(testimonials, setTestimonials, i, "b", e.target.value)
                  }
                  placeholder="Author"
                />
                <Input
                  value={row.c ?? ""}
                  onChange={(e) =>
                    updateRow(testimonials, setTestimonials, i, "c", e.target.value)
                  }
                  placeholder="Role"
                />
              </div>
            ))}
          </div>
        </div>
      </details>

      {aiAvailable ? (
        <button
          type="button"
          onClick={() => setUseAI((v) => !v)}
          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-card/50 p-4 text-left transition-colors hover:bg-card/70"
        >
          <span className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 text-foreground" />
            <span>
              <span className="block text-sm font-medium">
                Write the copy with AI
                {providerLabel ? (
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    via {providerLabel}
                  </span>
                ) : null}
              </span>
              <span className="block text-xs text-muted-foreground">
                {useAI
                  ? "AI writes a tailored tagline, bio, services & CTA from your details."
                  : "Off — we'll use the polished template for your profession."}
              </span>
            </span>
          </span>
          <span
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
              useAI ? "bg-foreground" : "bg-input"
            )}
          >
            <span
              className={cn(
                "inline-block size-5 rounded-full bg-background transition-transform",
                useAI ? "translate-x-[22px]" : "translate-x-0.5"
              )}
            />
          </span>
        </button>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <Button type="submit" size="lg" disabled={generating || !name.trim()}>
        {generating ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {aiAvailable && useAI ? "Writing your site…" : "Generating your site…"}
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            {aiAvailable && useAI ? "Generate with AI" : "Generate my site"}
          </>
        )}
      </Button>
    </form>
  );
}

function ThemeChoice({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-input bg-transparent hover:bg-accent"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
